/**
 * In-page text extraction (runs in the extension's ISOLATED world, injected
 * on demand with chrome.scripting — page scripts cannot reach these functions).
 *
 * page-agent is used here strictly READ-ONLY: we call PageController.updateTree()
 * to get its dehydrated text view of the DOM and never call any of its action
 * methods (click, input, scroll, executeJavascript). A unit test enforces that.
 * Analysing a hostile page with an agent that can act on that page would turn
 * every prompt injection into a possible click on "Subscribe".
 *
 * On top of page-agent's view we run our own visibility audit:
 *  - hidden text (CSS-hidden, off-screen, tiny, same colour as background,
 *    HTML comments, long attributes) is removed from the model input and
 *    reported, because a human reader never sees it;
 *  - "cloaked" text — visible to humans but marked to be skipped by AI agents
 *    (data-page-agent-ignore, data-browser-use-ignore, aria-hidden) — is added
 *    back, because it is part of what the user agrees to.
 */
import { PageController } from '@page-agent/page-controller'
import type { HiddenBlock } from '../core/injection'

export interface ExtractedPage {
  url: string
  title: string
  lang: string
  text: string
  hidden: HiddenBlock[]
  cloaked: string[]
  stats: { pageAgentChars: number; finalChars: number; hiddenRemoved: number; cloakedAdded: number; ms: number }
  extractor: string
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'IFRAME'])
const AGENT_SKIP_SELECTOR = '[data-page-agent-ignore="true"], [data-browser-use-ignore="true"], [aria-hidden="true"]'

/** page-agent marks interactive elements as `[12]<a href=...>text />`; keep only the text. */
export function dehydratedToText(dehydrated: string): string {
  return dehydrated
    .replace(/\*?\[\d+\]<[a-zA-Z][\w-]*(?:\s[^>\n]*?)?(?:>([\s\S]*?))?\s\/>/g, (_m, inner: string | undefined) => inner ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n')
}

function parseColor(c: string): [number, number, number, number] | null {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(c)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
}

function luminance([r, g, b]: [number, number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function effectiveBackground(el: Element | null): [number, number, number, number] {
  for (let e = el; e; e = e.parentElement) {
    const bg = parseColor(getComputedStyle(e).backgroundColor)
    if (bg && bg[3] > 0.5) return bg
    if (getComputedStyle(e).backgroundImage !== 'none') return [-1, -1, -1, 1] // unknown: image behind text
  }
  return [255, 255, 255, 1]
}

/** Returns why a text-bearing element is invisible to a human reader, or null if visible. */
export function hiddenReason(el: Element): string | null {
  if (!(el instanceof HTMLElement)) return null
  const visible = el.checkVisibility
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true } as CheckVisibilityOptions)
    : el.offsetParent !== null
  if (!visible) return 'css-hidden'
  const style = getComputedStyle(el)
  if (parseFloat(style.fontSize) < 4) return 'tiny-font'
  const rect = el.getBoundingClientRect()
  if (rect.width <= 1 || rect.height <= 1) return 'zero-size'
  const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth)
  const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight)
  const absLeft = rect.left + window.scrollX
  const absTop = rect.top + window.scrollY
  if (absLeft + rect.width <= 0 || absTop + rect.height <= 0 || absLeft >= docW || absTop >= docH) return 'off-screen'
  for (let e: HTMLElement | null = el; e; e = e.parentElement) {
    const s = getComputedStyle(e)
    if (/rect\(\s*0(px)?[, ]+0(px)?[, ]+0(px)?[, ]+0(px)?\s*\)/.test(s.clip) || /inset\(\s*50%/.test(s.clipPath)) return 'clipped'
  }
  const fg = parseColor(style.color)
  const bg = effectiveBackground(el)
  if (fg && bg[0] >= 0) {
    if (fg[3] < 0.1) return 'transparent-text'
    const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number]
    if ((l1 + 0.05) / (l2 + 0.05) < 1.2) return 'same-colour-as-background'
  }
  return null
}

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement
      if (!p || SKIP_TAGS.has(p.tagName.toUpperCase()) || p.closest('template')) return NodeFilter.FILTER_REJECT
      return (n.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text)
  return out
}

function collectComments(root: Node): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent ?? '').trim()
    if (t.length >= 20) out.push(t)
  }
  return out
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

export async function extractPage(): Promise<ExtractedPage> {
  const t0 = performance.now()

  // 1. page-agent's dehydrated text view (read-only use)
  const controller = new PageController({ viewportExpansion: -1, highlightOpacity: 0, highlightLabelOpacity: 0 })
  let dehydrated = ''
  try {
    dehydrated = await controller.updateTree()
  } finally {
    await controller.cleanUpHighlights()
    // page-agent leaves its (now empty) overlay container behind; leave the page as we found it
    document.getElementById('playwright-highlight-container')?.remove()
  }
  const paText = dehydratedToText(dehydrated)
  let lines = paText.split('\n')

  // 2. our visibility audit over every text node
  const hidden: HiddenBlock[] = []
  const cloaked: string[] = []
  const paNorm = norm(paText)
  const seenCloaked = new Set<Element>()
  for (const node of collectTextNodes(document.body)) {
    const el = node.parentElement!
    const text = norm(node.textContent ?? '')
    const reason = hiddenReason(el)
    if (reason) {
      if (text.length >= 12) hidden.push({ text, how: reason })
      // remove from model input if page-agent kept it (it only filters css-hidden)
      if (reason !== 'css-hidden' && text.split(' ').length >= 4) {
        const i = lines.findIndex((l) => norm(l) === text)
        if (i >= 0) lines.splice(i, 1)
      }
      continue
    }
    const skipper = el.closest(AGENT_SKIP_SELECTOR)
    if (skipper && text.length >= 20 && !paNorm.includes(text)) {
      const block = skipper as Element
      if (!seenCloaked.has(block)) {
        seenCloaked.add(block)
        cloaked.push(
          ((block as HTMLElement).innerText ?? text)
            .split('\n')
            .map(norm)
            .filter(Boolean)
            .join('\n'),
        )
      }
    }
  }
  for (const c of collectComments(document.documentElement)) hidden.push({ text: c, how: 'html-comment' })
  for (const el of Array.from(document.querySelectorAll('[title], [alt], [aria-label], meta[name="description"], meta[property^="og:"]'))) {
    for (const attr of ['title', 'alt', 'aria-label', 'content']) {
      const v = el.getAttribute(attr)
      if (v && v.length >= 40) hidden.push({ text: norm(v), how: `attribute:${attr}` })
    }
  }

  const finalText = [...lines, ...cloaked].join('\n')
  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang || '',
    text: finalText,
    hidden,
    cloaked,
    stats: {
      pageAgentChars: paText.length,
      finalChars: finalText.length,
      hiddenRemoved: paText.split('\n').length - lines.length,
      cloakedAdded: cloaked.length,
      ms: Math.round(performance.now() - t0),
    },
    extractor: '@page-agent/page-controller (read-only: updateTree)',
  }
}
