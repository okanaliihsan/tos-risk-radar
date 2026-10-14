/**
 * Splits extracted page text into numbered segments (S1, S2, ...).
 *
 * Segments are the unit the LLM cites, the unit quotes are verified against,
 * and the unit the eval scores. They are roughly one clause/sentence each.
 */

export interface Segment {
  id: string
  text: string
}

const MAX_SEGMENT_CHARS = 900
const MIN_SEGMENT_CHARS = 40

/** Abbreviations that end with a dot but do not end a sentence (EN + TR). */
const ABBREVIATIONS = [
  'e.g',
  'i.e',
  'etc',
  'inc',
  'ltd',
  'llc',
  'corp',
  'co',
  'vs',
  'no',
  'art',
  'sec',
  'u.s',
  'mr',
  'mrs',
  'dr',
  'st',
  'bkz',
  'vb',
  'vs',
  'örn',
  'md',
  'mad',
  'sn',
]

const TERMINAL = /[.!?;:)"'”]$/

/** Join text lines into blocks; inline markup splits one sentence across lines. */
function linesToBlocks(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0)

  const blocks: string[] = []
  let current = ''
  for (const line of lines) {
    if (!current) {
      current = line
      continue
    }
    const numberedHeading = /^(?:\d{1,3}(?:\.\d{1,3})*[.)]|[ivxlc]{1,5}[.)]|[a-z][.)])\s/i.test(line)
    const continues =
      !numberedHeading && !TERMINAL.test(current) && /^[\p{Ll}\p{N},.;:)\]'"%-]/u.test(line) // lower-case or punctuation start
    if (continues) {
      current += (/^[,.;:)\]%]/.test(line) ? '' : ' ') + line
    } else {
      blocks.push(current)
      current = line
    }
  }
  if (current) blocks.push(current)
  return blocks
}

function isAbbreviationBefore(text: string, dotIndex: number): boolean {
  const before = text.slice(Math.max(0, dotIndex - 6), dotIndex).toLowerCase()
  return ABBREVIATIONS.some((a) => before.endsWith(a) && !/\p{L}/u.test(before.charAt(before.length - a.length - 1)))
}

function splitSentences(block: string): string[] {
  const out: string[] = []
  let start = 0
  const re = /[.!?](?=["'”)]?\s+["'“(]?[\p{Lu}\p{N}])/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    if (m[0] === '.' && isAbbreviationBefore(block, m.index)) continue
    if (m[0] === '.' && /\d$/.test(block.slice(0, m.index)) && /^\.\d/.test(block.slice(m.index))) continue
    const end = m.index + 1
    out.push(block.slice(start, end).trim())
    start = end
  }
  const rest = block.slice(start).trim()
  if (rest) out.push(rest)
  return out
}

function hardWrap(sentence: string): string[] {
  if (sentence.length <= MAX_SEGMENT_CHARS) return [sentence]
  const parts: string[] = []
  let rest = sentence
  while (rest.length > MAX_SEGMENT_CHARS) {
    let cut = rest.lastIndexOf(' ', MAX_SEGMENT_CHARS)
    if (cut < MAX_SEGMENT_CHARS / 2) cut = MAX_SEGMENT_CHARS
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

export function segmentText(text: string): Segment[] {
  const pieces: string[] = []
  for (const block of linesToBlocks(text)) {
    const sentences = block.length > 300 ? splitSentences(block) : [block]
    // merge very short sentences into the next one (headings stay alone)
    let carry = ''
    for (const s of sentences) {
      const merged = carry ? `${carry} ${s}` : s
      if (merged.length < MIN_SEGMENT_CHARS && sentences.length > 1 && s !== sentences[sentences.length - 1]) {
        carry = merged
        continue
      }
      carry = ''
      pieces.push(...hardWrap(merged))
    }
    if (carry) pieces.push(carry)
  }
  return pieces.map((t, i) => ({ id: `S${i + 1}`, text: t }))
}

/** Wrap already-split texts (e.g. gold-labelled eval sentences) as segments. */
export function segmentsFromList(texts: string[]): Segment[] {
  return texts.map((t, i) => ({ id: `S${i + 1}`, text: t.trim() }))
}
