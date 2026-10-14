/**
 * Sentence-level scoring against CLAUDETTE gold labels.
 *
 * A prediction is (segmentId, category). Our categories map to CLAUDETTE codes
 * (price changes count as CH, as in the corpus guidelines). Categories with no
 * CLAUDETTE equivalent (data sharing, auto-renewal, ...) are "out of taxonomy":
 * they are listed for manual review and reported separately, never silently
 * counted as correct.
 */
import { CATEGORIES, CLAUDETTE_CODES, type CategoryId } from '../src/core/taxonomy'

export const EVAL_CODE: Partial<Record<CategoryId, string>> = Object.fromEntries(
  Object.values(CATEGORIES)
    .filter((c) => c.claudette)
    .map((c) => [c.id, c.claudette as string]),
)
EVAL_CODE.price_change = 'CH'

export interface Prediction {
  segmentId: string
  category: CategoryId
  quote?: string
  confidence?: number
}

export interface DocEval {
  doc: string
  sentences: number
  goldUnfair: number
  caught: { segmentId: string; gold: string[]; predicted: string[]; text: string }[]
  missed: { segmentId: string; gold: string[]; text: string }[]
  falseAlarms: { segmentId: string; predicted: string[]; text: string; quote?: string }[]
  outOfTaxonomy: { segmentId: string; categories: string[]; text: string; goldUnfair: boolean }[]
  perCode: Record<string, { tp: number; fp: number; fn: number }>
}

export function evaluateDoc(doc: string, gold: { text: string; labels: string[] }[], preds: Prediction[]): DocEval {
  const byId = new Map<string, Prediction[]>()
  for (const p of preds) byId.set(p.segmentId, [...(byId.get(p.segmentId) ?? []), p])

  const res: DocEval = {
    doc,
    sentences: gold.length,
    goldUnfair: gold.filter((g) => g.labels.length).length,
    caught: [],
    missed: [],
    falseAlarms: [],
    outOfTaxonomy: [],
    perCode: Object.fromEntries(CLAUDETTE_CODES.map((c) => [c, { tp: 0, fp: 0, fn: 0 }])),
  }

  gold.forEach((g, i) => {
    const id = `S${i + 1}`
    const ps = byId.get(id) ?? []
    const codes = [...new Set(ps.map((p) => EVAL_CODE[p.category]).filter((c): c is string => !!c))]
    const oot = [...new Set(ps.filter((p) => !EVAL_CODE[p.category]).map((p) => p.category))]
    const isGold = g.labels.length > 0

    // per-category
    for (const c of CLAUDETTE_CODES) {
      const inGold = g.labels.includes(c)
      const inPred = codes.includes(c)
      if (inGold && inPred) res.perCode[c]!.tp++
      else if (inPred) res.perCode[c]!.fp++
      else if (inGold) res.perCode[c]!.fn++
    }

    // binary detection (a sentence is "flagged" if any in-taxonomy category is predicted)
    if (oot.length) res.outOfTaxonomy.push({ segmentId: id, categories: oot, text: g.text, goldUnfair: isGold })
    if (codes.length && isGold) res.caught.push({ segmentId: id, gold: g.labels, predicted: codes, text: g.text })
    else if (codes.length && !isGold) res.falseAlarms.push({ segmentId: id, predicted: codes, text: g.text, quote: ps[0]?.quote })
    else if (isGold) res.missed.push({ segmentId: id, gold: g.labels, text: g.text })
  })
  return res
}

export interface Summary {
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  f1: number
  categoryMatch: number
  perCode: Record<string, { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }>
  outOfTaxonomy: number
  outOfTaxonomyOnGoldUnfair: number
}

const prf = (tp: number, fp: number, fn: number) => {
  const precision = tp + fp ? tp / (tp + fp) : 0
  const recall = tp + fn ? tp / (tp + fn) : 0
  return { precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0 }
}

export function summarize(evals: DocEval[]): Summary {
  const tp = evals.reduce((s, e) => s + e.caught.length, 0)
  const fp = evals.reduce((s, e) => s + e.falseAlarms.length, 0)
  const fn = evals.reduce((s, e) => s + e.missed.length, 0)
  const categoryMatch = evals.reduce((s, e) => s + e.caught.filter((c) => c.predicted.some((p) => c.gold.includes(p))).length, 0)
  const perCode: Summary['perCode'] = {}
  for (const c of CLAUDETTE_CODES) {
    const t = evals.reduce((s, e) => s + e.perCode[c]!.tp, 0)
    const f = evals.reduce((s, e) => s + e.perCode[c]!.fp, 0)
    const n = evals.reduce((s, e) => s + e.perCode[c]!.fn, 0)
    perCode[c] = { tp: t, fp: f, fn: n, ...prf(t, f, n) }
  }
  return {
    tp,
    fp,
    fn,
    ...prf(tp, fp, fn),
    categoryMatch,
    perCode,
    outOfTaxonomy: evals.reduce((s, e) => s + e.outOfTaxonomy.length, 0),
    outOfTaxonomyOnGoldUnfair: evals.reduce((s, e) => s + e.outOfTaxonomy.filter((o) => o.goldUnfair).length, 0),
  }
}
