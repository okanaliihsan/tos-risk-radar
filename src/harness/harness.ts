/**
 * Dev harness / extension simulator, used for the Cypress demo.
 *
 * Cypress cannot drive a chrome-extension:// popup, so this page reproduces the
 * extension's data flow with the same modules:
 *   iframe (= tab) --extractor.js (page-agent read-only)--> ExtractedPage
 *   --> analyze() with OpenAICompatibleClient --> renderReport()
 *
 * Differences from the real extension, stated honestly:
 *   - the extractor runs in the page's main world, not an isolated world;
 *   - the API key is held by this page (fine for local testing only).
 */
import { analyze } from '../core/analyze'
import { isGoogleKey, OpenAICompatibleClient } from '../core/llm'
import type { ExtractedPage } from '../extractor/extract'
import { renderDisclaimer, renderError, renderProgress, renderReport } from '../ui/render'

interface HarnessLlm {
  baseURL: string
  model: string
  apiKey: string
}

declare global {
  interface Window {
    __TOS_RADAR_LLM__?: Partial<HarnessLlm>
    __tosRadarLastReport?: unknown
  }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const app = $('app')
const iframe = $<HTMLIFrameElement>('tab')
const pageSel = $<HTMLSelectElement>('page')
const btn = $<HTMLButtonElement>('analyze')

function llmConfig(): HarnessLlm {
  const injected = window.__TOS_RADAR_LLM__ ?? {}
  let saved: Partial<HarnessLlm> = {}
  try {
    saved = JSON.parse(localStorage.getItem('tosRadarHarnessLlm') ?? '{}')
  } catch {
    /* storage unavailable */
  }
  const cfg: HarnessLlm = {
    baseURL: $<HTMLInputElement>('baseURL').value || injected.baseURL || saved.baseURL || '',
    model: $<HTMLInputElement>('model').value || injected.model || saved.model || '',
    apiKey: $<HTMLInputElement>('apiKey').value || injected.apiKey || saved.apiKey || '',
  }
  // a Google key without an explicit address selects Gemini, as in the extension
  const google = isGoogleKey(cfg.apiKey)
  cfg.baseURL ||= google ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://api.openai.com/v1'
  cfg.model ||= google ? 'gemini-3.5-flash-lite' : 'gpt-4.1-mini'
  return cfg
}

async function loadPages() {
  const list = (await (await fetch('fixtures/index.json')).json()) as { file: string; label: string }[]
  for (const p of list) {
    const o = document.createElement('option')
    o.value = p.file
    o.textContent = p.label
    pageSel.append(o)
  }
  const fromUrl = new URLSearchParams(location.search).get('page')
  if (fromUrl && list.some((p) => p.file === fromUrl)) pageSel.value = fromUrl
  pageSel.onchange = () => openPage(pageSel.value)
  openPage(pageSel.value)
}

function openPage(file: string) {
  iframe.src = `fixtures/${file}`
  app.replaceChildren(renderDisclaimer())
  btn.disabled = false
}

async function extractFromTab(): Promise<ExtractedPage> {
  const win = iframe.contentWindow as (Window & { __tosRadarExtract?: () => Promise<ExtractedPage> }) | null
  const doc = iframe.contentDocument
  if (!win || !doc) throw new Error('sekme hazır değil')
  if (!win.__tosRadarExtract) {
    await new Promise<void>((resolve, reject) => {
      const s = doc.createElement('script')
      s.src = new URL('extractor.js', location.href).href
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('extractor.js yüklenemedi'))
      doc.head.append(s)
    })
  }
  return win.__tosRadarExtract!()
}

btn.onclick = async () => {
  btn.disabled = true
  const cfg = llmConfig()
  app.replaceChildren(renderDisclaimer(), renderProgress('Sayfa metni okunuyor (page-agent)'))
  try {
    const page = await extractFromTab()
    const gemini = cfg.baseURL.includes('googleapis')
    const client = new OpenAICompatibleClient({
      baseURL: cfg.baseURL,
      apiKey: cfg.apiKey,
      model: cfg.model,
      temperature: gemini ? null : 0,
      reasoningEffort: gemini ? 'low' : undefined,
    })
    const report = await analyze(
      { url: page.url, title: page.title, text: page.text, hidden: page.hidden, cloaked: page.cloaked },
      client,
      { onProgress: (p) => app.replaceChildren(renderDisclaimer(), renderProgress(p)) },
    )
    window.__tosRadarLastReport = report
    app.replaceChildren(renderReport(report, { extractor: page.extractor }))
  } catch (e) {
    app.replaceChildren(renderDisclaimer(), renderError(`Analiz başarısız: ${(e as Error).message}`))
  } finally {
    btn.disabled = false
  }
}

$('toggle-cfg').onclick = (e) => {
  e.preventDefault()
  $('llmcfg').classList.toggle('show')
}

void loadPages()
