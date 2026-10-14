/**
 * Deterministic text normalisation used for quote matching.
 *
 * Only differences that cannot change meaning are folded: case, whitespace,
 * typographic quotes/dashes, invisible characters, the dotted/dotless i, and
 * ellipsis characters. Words themselves are never altered, so a paraphrase
 * still fails to match.
 *
 * `normalizeWithMap` also returns, for every normalised character, the index
 * of the original character it came from. That lets the UI show the exact
 * original span instead of the model's copy of it.
 */

const CHAR_FOLD: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '‚': "'",
  '‛': "'",
  '′': "'",
  '`': "'",
  '´': "'",
  '“': '"',
  '”': '"',
  '„': '"',
  '«': '"',
  '»': '"',
  '‐': '-',
  '‑': '-',
  '‒': '-',
  '–': '-',
  '—': '-',
  '―': '-',
  '−': '-',
  'ı': 'i', // dotless ı
  'İ': 'i', // dotted İ
  ' ': ' ',
}

const INVISIBLE = /[­​-‏‪-‮⁠-⁤﻿]/

export interface NormalizedText {
  text: string
  /** map[i] = index in the original string of normalised char i */
  map: number[]
}

export function normalizeWithMap(input: string): NormalizedText {
  const out: string[] = []
  const map: number[] = []
  let lastWasSpace = true // trims leading whitespace

  for (let i = 0; i < input.length; i++) {
    let ch = input[i]!
    if (INVISIBLE.test(ch)) continue
    ch = CHAR_FOLD[ch] ?? ch
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue
      out.push(' ')
      map.push(i)
      lastWasSpace = true
      continue
    }
    // NFKC + lowercase can expand one char into several; keep them all mapped to i
    const folded = ch.normalize('NFKC').toLowerCase().normalize('NFKC')
    for (const f of folded) {
      const g = CHAR_FOLD[f] ?? f
      if (g === '̇') continue // combining dot left over from İ lowercasing
      out.push(g)
      map.push(i)
    }
    lastWasSpace = false
  }
  if (out[out.length - 1] === ' ') {
    out.pop()
    map.pop()
  }
  return { text: out.join(''), map }
}

export function normalize(input: string): string {
  return normalizeWithMap(input).text
}

export function wordCount(input: string): number {
  const n = normalize(input)
  return n ? n.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0
}
