/**
 * Deterministic quote verification: "a claim without a quote is invalid".
 *
 * A finding survives only if its quote occurs in the text the model was shown,
 * after meaning-preserving normalisation (see normalize.ts). The span shown to
 * the user is cut from the ORIGINAL segment text, never taken from the model.
 */
import { normalizeWithMap, wordCount, type NormalizedText } from './normalize'
import type { Segment } from './segment'

export const MIN_QUOTE_WORDS = 5
export const MIN_FRAGMENT_WORDS = 3

export type RejectReason =
  | 'quote_too_short'
  | 'ellipsis_fragment_too_short'
  | 'quote_not_found'
  | 'unknown_segment_and_not_found'

export type VerifyResult =
  | {
      ok: true
      segmentId: string
      /** exact original text span the quote corresponds to */
      original: string
      /** true when the model cited the wrong segment id but the quote exists elsewhere */
      segmentCorrected: boolean
    }
  | { ok: false; reason: RejectReason }

const ELLIPSIS = /\s*(?:\[\s*(?:\.\s*){3}\]|\.{3,}|…)\s*/

export class QuoteIndex {
  private readonly normalized = new Map<string, NormalizedText>()
  private readonly byId = new Map<string, Segment>()

  constructor(private readonly segments: Segment[]) {
    for (const s of segments) {
      this.byId.set(s.id, s)
      this.normalized.set(s.id, normalizeWithMap(s.text))
    }
  }

  /** Find all fragments, in order, inside one segment. Returns original-text span. */
  private matchIn(segmentId: string, fragments: string[]): string | null {
    const seg = this.byId.get(segmentId)
    const norm = this.normalized.get(segmentId)
    if (!seg || !norm) return null
    let from = 0
    let first = -1
    let lastEnd = -1
    for (const frag of fragments) {
      const idx = norm.text.indexOf(frag, from)
      if (idx < 0) return null
      if (first < 0) first = idx
      lastEnd = idx + frag.length
      from = lastEnd
    }
    const start = norm.map[first]!
    const end = norm.map[lastEnd - 1]! + 1
    return seg.text.slice(start, end)
  }

  verify(quote: string, claimedSegmentId: string): VerifyResult {
    if (wordCount(quote) < MIN_QUOTE_WORDS) return { ok: false, reason: 'quote_too_short' }

    const fragments = quote
      .split(ELLIPSIS)
      .map((f) => normalizeWithMap(f).text)
      .filter((f) => f.length > 0)
    if (fragments.length > 1 && fragments.some((f) => wordCount(f) < MIN_FRAGMENT_WORDS)) {
      return { ok: false, reason: 'ellipsis_fragment_too_short' }
    }

    const direct = this.matchIn(claimedSegmentId, fragments)
    if (direct !== null) {
      return { ok: true, segmentId: claimedSegmentId, original: direct, segmentCorrected: false }
    }
    for (const s of this.segments) {
      if (s.id === claimedSegmentId) continue
      const span = this.matchIn(s.id, fragments)
      if (span !== null) return { ok: true, segmentId: s.id, original: span, segmentCorrected: true }
    }
    return {
      ok: false,
      reason: this.byId.has(claimedSegmentId) ? 'quote_not_found' : 'unknown_segment_and_not_found',
    }
  }
}
