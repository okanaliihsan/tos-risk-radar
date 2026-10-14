/**
 * Builds eval/data/claudette_subset.json from the ToS_100 corpus
 * (CLAUDETTE annotations, distributed in github.com/federicoruggeri/Memnet_ToS,
 * MIT licence). Each sentence keeps its expert unfairness labels.
 *
 *   node --import tsx eval/prepare.ts /path/to/Memnet_ToS/local_database/ToS_100/dataset.csv
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { CLAUDETTE_CODES } from '../src/core/taxonomy'

export const EVAL_DOCS = ['Google', 'Netflix', 'Dropbox', 'Pinterest', 'WhatsApp', 'Reddit', 'YouTube', 'Facebook', 'Uber', 'Tinder']

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Undo Stanford CoreNLP tokenisation so the text reads like a web page. */
export function detokenize(s: string): string {
  return s
    .replace(/-lrb-/g, '(')
    .replace(/-rrb-/g, ')')
    .replace(/-lsb-/g, '[')
    .replace(/-rsb-/g, ']')
    .replace(/-lcb-/g, '{')
    .replace(/-rcb-/g, '}')
    .replace(/``\s*/g, '"')
    .replace(/\s*''/g, '"')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([,.;:!?%])/g, '$1')
    .replace(/\s+(n't|'s|'re|'ve|'ll|'d|'m)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface EvalSentence {
  text: string
  labels: string[]
}
export interface EvalDoc {
  doc: string
  sentences: EvalSentence[]
}

function main() {
  const csvPath = process.argv[2] ?? path.resolve(import.meta.dirname, '../../datasets/Memnet_ToS/local_database/ToS_100/dataset.csv')
  const rows = parseCsv(readFileSync(csvPath, 'utf8'))
  const header = rows[0]!
  const col = (name: string) => header.indexOf(name)
  const docs = new Map<string, EvalSentence[]>()
  for (const r of rows.slice(1)) {
    if (r.length < header.length) continue
    const doc = r[col('document')]!
    if (!EVAL_DOCS.includes(doc)) continue
    const labels = CLAUDETTE_CODES.filter((c) => r[col(c)] === '1')
    const list = docs.get(doc) ?? []
    list.push({ text: detokenize(r[col('text')]!), labels })
    docs.set(doc, list)
  }
  const out: EvalDoc[] = EVAL_DOCS.map((d) => ({ doc: d, sentences: docs.get(d) ?? [] }))
  for (const d of out) if (!d.sentences.length) throw new Error(`no sentences for ${d.doc}`)
  const dir = path.resolve(import.meta.dirname, 'data')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, 'claudette_subset.json'),
    JSON.stringify(
      {
        source: 'ToS_100 corpus with CLAUDETTE sentence-level unfairness labels (Lippi et al. 2019; Ruggeri et al. 2021), via github.com/federicoruggeri/Memnet_ToS (MIT). Text detokenised; original is lower-cased.',
        codes: { A: 'arbitration', CH: 'unilateral change', CR: 'content removal', J: 'jurisdiction', LAW: 'choice of law', LTD: 'limitation of liability', TER: 'unilateral termination', USE: 'contract by using', PINC: 'privacy included by using' },
        docs: out,
      },
      null,
      1,
    ),
  )
  for (const d of out) console.log(`${d.doc}: ${d.sentences.length} sentences, ${d.sentences.filter((s) => s.labels.length).length} unfair`)
}

if (process.argv[1]?.endsWith('prepare.ts')) main()
