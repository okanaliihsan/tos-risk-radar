/** Reads every ToS_100 sentence that is NOT part of the eval subset (held-out data). */
import { readFileSync } from 'node:fs'
import { detokenize, parseCsv } from './prepare'

export function readHeldout(csvPath: string, exclude: string[]): { doc: string; text: string }[] {
  const rows = parseCsv(readFileSync(csvPath, 'utf8'))
  const header = rows[0]!
  const di = header.indexOf('document')
  const ti = header.indexOf('text')
  return rows
    .slice(1)
    .filter((r) => r.length >= header.length && !exclude.includes(r[di]!))
    .map((r) => ({ doc: r[di]!, text: detokenize(r[ti]!) }))
}
