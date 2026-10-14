/**
 * Deterministic risk score (0-100). The LLM never sets the score.
 *
 * For each category that has at least one verified, confident finding:
 *   points = SEVERITY_POINTS[max severity in that category]
 *          + EXTRA_POINTS per additional finding in that category (capped)
 * score = min(100, sum of category points)
 *
 * Counting per category (not per finding) stops a long document that repeats
 * the same clause from inflating the score.
 */
import type { CategoryId, Severity } from './taxonomy'

export const SEVERITY_POINTS: Record<Severity, number> = { low: 6, medium: 12, high: 20 }
export const EXTRA_POINTS = 2
export const MAX_EXTRA_PER_CATEGORY = 4

export const BANDS = [
  { min: 75, id: 'very_high', label: 'Çok yüksek' },
  { min: 50, id: 'high', label: 'Yüksek' },
  { min: 25, id: 'medium', label: 'Orta' },
  { min: 0, id: 'low', label: 'Düşük' },
] as const
export type BandId = (typeof BANDS)[number]['id']

export interface ScorableFinding {
  category: CategoryId
  severity: Severity
}

export interface ScoreBreakdownItem {
  category: CategoryId
  maxSeverity: Severity
  count: number
  points: number
}

export interface Score {
  value: number
  band: BandId
  bandLabel: string
  breakdown: ScoreBreakdownItem[]
}

const RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 }

export function computeScore(findings: ScorableFinding[]): Score {
  const byCat = new Map<CategoryId, ScorableFinding[]>()
  for (const f of findings) {
    const list = byCat.get(f.category) ?? []
    list.push(f)
    byCat.set(f.category, list)
  }
  const breakdown: ScoreBreakdownItem[] = []
  for (const [category, list] of byCat) {
    const maxSeverity = list.reduce<Severity>((m, f) => (RANK[f.severity] > RANK[m] ? f.severity : m), 'low')
    const extra = Math.min(MAX_EXTRA_PER_CATEGORY, (list.length - 1) * EXTRA_POINTS)
    breakdown.push({ category, maxSeverity, count: list.length, points: SEVERITY_POINTS[maxSeverity] + extra })
  }
  breakdown.sort((a, b) => b.points - a.points || a.category.localeCompare(b.category))
  const value = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0))
  const band = BANDS.find((b) => value >= b.min)!
  return { value, band: band.id, bandLabel: band.label, breakdown }
}
