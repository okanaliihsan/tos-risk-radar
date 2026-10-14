/** Report data model shared by the pipeline, the extension UI and the eval. */
import type { CategoryId, Severity } from './taxonomy'
import type { Score } from './score'
import type { SuspiciousItem } from './injection'
import type { RejectReason } from './verify'

export const DISCLAIMER_TR =
  'Bu rapor otomatik olarak üretilmiştir ve hukuki tavsiye değildir. Önemli kararlar için metnin aslını okuyun ve gerekirse bir hukukçuya danışın.'

export interface VerifiedFinding {
  segmentId: string
  category: CategoryId
  severity: Severity
  /** exact text cut from the page segment (not the model's copy) */
  quote: string
  /** full text of the segment the quote is in, for context */
  context: string
  explanationTr: string
  confidence: number
  /** a rule-based pattern also flagged this segment for this category */
  ruleAgreement: boolean
  segmentCorrected: boolean
}

export interface RejectedClaim {
  reason: RejectReason | 'quote_from_quarantined_segment' | 'duplicate'
  category: CategoryId
  claimedSegmentId: string
  /** the model's (unverified) quote, shown only as evidence of rejection */
  modelQuote: string
}

export interface PossiblyMissed {
  segmentId: string
  category: CategoryId
  text: string
}

export type ReportStatus = 'ok' | 'partial' | 'failed' | 'not_legal' | 'insufficient_text'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface LlmCallTrace {
  chunk: number
  attempt: number
  mode: string
  model: string
  rawText: string
  errors: string[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  durationMs: number
}

export interface Report {
  schemaVersion: 1
  url: string
  title: string
  analyzedAt: string
  model: string
  status: ReportStatus
  documentType: string | null
  score: Score
  findings: VerifiedFinding[]
  uncertain: VerifiedFinding[]
  rejected: RejectedClaim[]
  possiblyMissed: PossiblyMissed[]
  security: {
    hiddenBlocks: number
    /** collapsed/revealable hidden text blocks that were included in the analysis */
    restoredHidden: number
    /** human-visible text the page tried to hide from AI agents; it was added back into the analysis */
    cloakedBlocks: string[]
    quarantinedSegments: string[]
    suspicious: SuspiciousItem[]
    /** instructions the model itself reported (verified to exist in the text when possible) */
    modelReported: { segmentId: string; quote: string; reason: string; verified: boolean }[]
  }
  coverage: {
    segmentsTotal: number
    segmentsAnalyzed: number
    charsTotal: number
    charsAnalyzed: number
    truncated: boolean
    failedChunks: number
    chunks: number
  }
  confidence: { level: ConfidenceLevel; reasons: string[] }
  disclaimer: string
  errors: string[]
  trace: LlmCallTrace[]
}
