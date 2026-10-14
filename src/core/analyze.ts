/**
 * The analysis pipeline. Pure: no DOM, no chrome.* APIs, so it runs the same
 * in the extension service worker, in the dev harness, in Node eval and in tests.
 *
 *   text ─► segment ─► injection screen ─► chunk ─► LLM (JSON schema)
 *        ─► parse + Zod validate (1 repair retry) ─► quote verification
 *        ─► dedupe ─► confidence split ─► deterministic score
 *        ─► rule cross-check ─► uncertainty assessment ─► Report
 */
import { parseLlmOutput, type LlmFinding, type LlmOutput } from './schema'
import { segmentText, type Segment } from './segment'
import { restorableHidden, screenSegments, type HiddenBlock } from './injection'
import { makeNonce, repairPrompt, systemPrompt, userPrompt, type ChatMessage } from './prompt'
import type { LlmClient } from './llm'
import { QuoteIndex } from './verify'
import { computeScore } from './score'
import { runRules } from './rules'
import { CATEGORIES, type CategoryId } from './taxonomy'
import {
  DISCLAIMER_TR,
  type ConfidenceLevel,
  type LlmCallTrace,
  type PossiblyMissed,
  type RejectedClaim,
  type Report,
  type VerifiedFinding,
} from './report'

export interface PageInput {
  url: string
  title: string
  /** visible text as produced by the extractor */
  text?: string
  /** pre-split segments (eval uses gold-labelled sentences) */
  segments?: Segment[]
  /** hidden text found on the page; never sent to the model */
  hidden?: HiddenBlock[]
  /** visible text the page marked to be skipped by AI agents (already included in text) */
  cloaked?: string[]
}

export interface AnalyzeOptions {
  maxCharsPerCall?: number
  maxCalls?: number
  minConfidence?: number
  /** 0 disables the repair retry */
  repairRetries?: number
  /** disable quarantine (only for the injection ablation eval) */
  disableQuarantine?: boolean
  maxPossiblyMissed?: number
  nonce?: string
  now?: () => Date
  onProgress?: (msg: string) => void
}

const SEV_RANK = { low: 0, medium: 1, high: 2 } as const
const MIN_TEXT_CHARS = 200

function chunkSegments(segments: Segment[], maxChars: number): Segment[][] {
  const chunks: Segment[][] = []
  let cur: Segment[] = []
  let size = 0
  for (const s of segments) {
    const len = s.text.length + s.id.length + 4
    if (cur.length && size + len > maxChars) {
      chunks.push(cur)
      cur = []
      size = 0
    }
    cur.push(s)
    size += len
  }
  if (cur.length) chunks.push(cur)
  return chunks
}

function emptyReport(input: PageInput, model: string, now: Date): Report {
  return {
    schemaVersion: 1,
    url: input.url,
    title: input.title,
    analyzedAt: now.toISOString(),
    model,
    status: 'ok',
    documentType: null,
    score: computeScore([]),
    findings: [],
    uncertain: [],
    rejected: [],
    possiblyMissed: [],
    security: { hiddenBlocks: input.hidden?.length ?? 0, restoredHidden: 0, cloakedBlocks: input.cloaked ?? [], quarantinedSegments: [], suspicious: [], modelReported: [] },
    coverage: { segmentsTotal: 0, segmentsAnalyzed: 0, charsTotal: 0, charsAnalyzed: 0, truncated: false, failedChunks: 0, chunks: 0 },
    confidence: { level: 'high', reasons: [] },
    disclaimer: DISCLAIMER_TR,
    errors: [],
    trace: [],
  }
}

async function callWithValidation(
  client: LlmClient,
  base: ChatMessage[],
  chunkIndex: number,
  retries: number,
  trace: LlmCallTrace[],
): Promise<{ ok: true; value: LlmOutput } | { ok: false; transport?: boolean; errors: string[] }> {
  const messages = [...base]
  let lastErrors: string[] = []
  for (let attempt = 0; attempt <= retries; attempt++) {
    const t0 = Date.now()
    let text: string
    try {
      const res = await client.complete(messages)
      text = res.text
      const parsed = parseLlmOutput(text)
      trace.push({
        chunk: chunkIndex,
        attempt,
        mode: res.mode,
        model: res.model,
        rawText: text,
        errors: parsed.ok ? [] : parsed.errors,
        usage: res.usage,
        durationMs: Date.now() - t0,
      })
      if (parsed.ok) return { ok: true, value: parsed.value }
      lastErrors = parsed.errors
    } catch (e) {
      const msg = (e as Error).message
      trace.push({ chunk: chunkIndex, attempt, mode: '-', model: client.model, rawText: '', errors: [msg], durationMs: Date.now() - t0 })
      const body = (e as { body?: string }).body
      return { ok: false, transport: true, errors: [body ? `${msg}: ${body.slice(0, 300)}` : msg] } // not retried with a repair prompt
    }
    messages.push({ role: 'assistant', content: text }, { role: 'user', content: repairPrompt(lastErrors) })
  }
  return { ok: false, errors: lastErrors }
}

export async function analyze(input: PageInput, client: LlmClient, opts: AnalyzeOptions = {}): Promise<Report> {
  const now = (opts.now ?? (() => new Date()))()
  const maxChars = opts.maxCharsPerCall ?? 40_000
  const maxCalls = opts.maxCalls ?? 4
  const minConfidence = opts.minConfidence ?? 0.6
  const retries = opts.repairRetries ?? 1
  const progress = opts.onProgress ?? (() => {})
  const report = emptyReport(input, client.model, now)

  // 1. segment (collapsed-but-revealable hidden text is part of the contract)
  const restored = input.segments ? [] : restorableHidden(input.hidden ?? [], input.text ?? '')
  report.security.restoredHidden = restored.length
  const fullText = restored.length ? `${input.text ?? ''}\n${restored.join('\n')}` : input.text ?? ''
  const segments = input.segments ?? segmentText(fullText)
  const charsTotal = segments.reduce((s, x) => s + x.text.length, 0)
  report.coverage.segmentsTotal = segments.length
  report.coverage.charsTotal = charsTotal
  if (charsTotal < MIN_TEXT_CHARS) {
    report.status = 'insufficient_text'
    report.confidence = { level: 'low', reasons: ['Sayfada analiz edilecek kadar metin bulunamadı.'] }
    return report
  }

  // 2. injection screen (hidden text is reported, never sent)
  const screen = screenSegments(segments, input.hidden ?? [])
  const toSend = opts.disableQuarantine ? segments : screen.sanitized
  report.security.quarantinedSegments = opts.disableQuarantine ? [] : screen.quarantinedIds
  report.security.suspicious = screen.suspicious

  // 3. chunk + budget
  const allChunks = chunkSegments(toSend, maxChars)
  const chunks = allChunks.slice(0, maxCalls)
  const analyzedSegments = chunks.flat()
  report.coverage.chunks = chunks.length
  report.coverage.segmentsAnalyzed = analyzedSegments.length
  report.coverage.charsAnalyzed = analyzedSegments.reduce((s, x) => s + x.text.length, 0)
  report.coverage.truncated = allChunks.length > chunks.length

  // 4. LLM calls
  const nonce = opts.nonce ?? makeNonce()
  const proposals: LlmFinding[] = []
  const modelSuspicious: LlmOutput['suspicious_instructions'] = []
  const docTypes: string[] = []
  const transportErrors: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    progress(`LLM çağrısı ${i + 1}/${chunks.length}`)
    const base: ChatMessage[] = [
      { role: 'system', content: systemPrompt(nonce) },
      { role: 'user', content: userPrompt(nonce, { url: input.url, title: input.title }, chunks[i]!, { index: i, total: chunks.length }) },
    ]
    const res = await callWithValidation(client, base, i, retries, report.trace)
    if (!res.ok) {
      if (res.transport) transportErrors.push(res.errors[0] ?? '')
      report.coverage.failedChunks++
      report.errors.push(`Parça ${i + 1}: ${res.errors.slice(0, 3).join(' | ')}`)
      continue
    }
    proposals.push(...res.value.findings)
    modelSuspicious.push(...res.value.suspicious_instructions)
    docTypes.push(res.value.document_type)
  }

  if (report.coverage.failedChunks === chunks.length) {
    report.status = 'failed'
    report.confidence = {
      level: 'low',
      reasons: transportErrors.length
        ? [`LLM servisine bağlanılamadı. ${transportHint(transportErrors[0]!)}`]
        : ['Model geçerli (şemaya uygun) bir yanıt üretemedi; rapor oluşturulamadı.'],
    }
    return report
  }

  // 5. verify quotes against exactly what the model saw
  progress('Alıntılar doğrulanıyor')
  const index = new QuoteIndex(analyzedSegments)
  const quarantined = new Set(report.security.quarantinedSegments)
  const segText = new Map(analyzedSegments.map((s) => [s.id, s.text]))
  const verified: VerifiedFinding[] = []
  const rejected: RejectedClaim[] = []
  for (const p of proposals) {
    const v = index.verify(p.quote, p.segment_id)
    if (!v.ok) {
      rejected.push({ reason: v.reason, category: p.category, claimedSegmentId: p.segment_id, modelQuote: p.quote })
      continue
    }
    if (quarantined.has(v.segmentId)) {
      rejected.push({ reason: 'quote_from_quarantined_segment', category: p.category, claimedSegmentId: p.segment_id, modelQuote: p.quote })
      continue
    }
    verified.push({
      segmentId: v.segmentId,
      category: p.category,
      severity: p.severity,
      quote: v.original,
      context: segText.get(v.segmentId) ?? '',
      explanationTr: p.explanation_tr,
      confidence: p.confidence,
      ruleAgreement: false,
      segmentCorrected: v.segmentCorrected,
    })
  }

  // 6. dedupe per (segment, category): keep the most severe, then most confident
  const best = new Map<string, VerifiedFinding>()
  for (const f of verified) {
    const key = `${f.segmentId}|${f.category}`
    const prev = best.get(key)
    if (!prev || SEV_RANK[f.severity] > SEV_RANK[prev.severity] || (f.severity === prev.severity && f.confidence > prev.confidence)) {
      if (prev) rejected.push({ reason: 'duplicate', category: prev.category, claimedSegmentId: prev.segmentId, modelQuote: prev.quote })
      best.set(key, f)
    } else {
      rejected.push({ reason: 'duplicate', category: f.category, claimedSegmentId: f.segmentId, modelQuote: f.quote })
    }
  }
  const deduped = [...best.values()]

  // 7. rule cross-check
  const hits = runRules(analyzedSegments.filter((s) => !quarantined.has(s.id)))
  const hitKeys = new Set(hits.map((h) => `${h.segmentId}|${h.category}`))
  for (const f of deduped) f.ruleAgreement = hitKeys.has(`${f.segmentId}|${f.category}`)
  const reportedSegments = new Set(deduped.map((f) => f.segmentId))
  const missed: PossiblyMissed[] = []
  const seenMissed = new Set<string>()
  for (const h of hits) {
    if (reportedSegments.has(h.segmentId) || seenMissed.has(h.segmentId)) continue
    seenMissed.add(h.segmentId)
    missed.push({ segmentId: h.segmentId, category: h.category, text: segText.get(h.segmentId) ?? '' })
  }
  const sevOf = (c: CategoryId) => SEV_RANK[CATEGORIES[c].defaultSeverity]
  missed.sort((a, b) => sevOf(b.category) - sevOf(a.category))

  // 8. confidence split + score
  const order = (a: VerifiedFinding, b: VerifiedFinding) =>
    SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.confidence - a.confidence || Number(a.segmentId.slice(1)) - Number(b.segmentId.slice(1))
  report.findings = deduped.filter((f) => f.confidence >= minConfidence).sort(order)
  report.uncertain = deduped.filter((f) => f.confidence < minConfidence).sort(order)
  report.rejected = rejected
  report.possiblyMissed = missed.slice(0, opts.maxPossiblyMissed ?? 8)
  report.score = computeScore(report.findings)

  // 9. what the model itself flagged as injected instructions
  report.security.modelReported = modelSuspicious.map((s) => {
    const v = s.quote.trim().split(/\s+/).length >= 5 ? index.verify(s.quote, s.segment_id) : { ok: false as const }
    return { segmentId: s.segment_id, quote: s.quote, reason: s.reason, verified: v.ok }
  })

  // 10. document type: majority over chunks, preferring a legal type over not_legal
  const legal = docTypes.filter((d) => d !== 'not_legal')
  report.documentType = legal.length ? mostCommon(legal) : docTypes[0] ?? null

  // 11. status + honest uncertainty
  const reasons: string[] = []
  let level: ConfidenceLevel = 'high'
  const lower = (l: ConfidenceLevel) => {
    if (l === 'low' || (l === 'medium' && level === 'high')) level = l
  }
  if (report.documentType === 'not_legal' && !legal.length) {
    report.status = 'not_legal'
    reasons.push('Model bu sayfayı bir sözleşme / politika metni olarak sınıflandırmadı.')
    lower('low')
  } else if (report.coverage.failedChunks > 0 || report.coverage.truncated) {
    report.status = 'partial'
  }
  if (report.coverage.failedChunks > 0) {
    reasons.push(`${report.coverage.failedChunks}/${chunks.length} metin parçası analiz edilemedi (geçersiz model yanıtı).`)
    lower('low')
  }
  if (report.coverage.truncated) {
    const pct = Math.round((100 * report.coverage.charsAnalyzed) / charsTotal)
    reasons.push(`Metin çok uzun; yalnızca ilk %${pct}'i analiz edildi.`)
    lower(pct < 70 ? 'low' : 'medium')
  }
  const notFound = rejected.filter((r) => r.reason !== 'duplicate').length
  const proposed = proposals.length
  if (notFound > 0) {
    reasons.push(`Modelin ${proposed} iddiasından ${notFound} tanesi sayfada birebir bulunamadığı için reddedildi.`)
    if (proposed > 0 && notFound / proposed >= 0.3) lower('low')
    else lower('medium')
  }
  if (report.uncertain.length > 0) {
    reasons.push(`${report.uncertain.length} madde düşük güvenle işaretlendi; skora dahil edilmedi.`)
    lower('medium')
  }
  if (report.possiblyMissed.length >= 3) {
    reasons.push(`Kural tabanlı tarama, modelin raporlamadığı ${missed.length} olası madde buldu.`)
    lower('medium')
  }
  const injected = screen.suspicious.length + report.security.modelReported.length
  if (injected > 0) {
    reasons.push('Sayfada yapay zekâya yönelik talimat benzeri metin bulundu. Bu metin analizden çıkarıldı, ancak sayfanın içeriği manipüle edilmiş olabilir.')
    lower('medium')
  }
  if (report.security.cloakedBlocks.length > 0) {
    reasons.push(`Sayfadaki ${report.security.cloakedBlocks.length} görünür metin bloğu yapay zekâ araçlarından gizlenmeye çalışılmış (ör. data-page-agent-ignore / aria-hidden); bu metinler analize eklendi.`)
    lower('medium')
  }
  if (report.security.restoredHidden > 0) {
    reasons.push(`Sayfada kapalı/katlanmış ${report.security.restoredHidden} metin bloğu (ör. akordiyon bölümleri) vardı; kullanıcı açabildiği için analize dahil edildi.`)
  }
  if (!reasons.length) reasons.push('Tüm bulgular sayfadaki metinle birebir doğrulandı.')
  report.confidence = { level, reasons }
  return report
}

function mostCommon(xs: string[]): string {
  const counts = new Map<string, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
}

/** Turns an HTTP failure into an actionable Turkish hint (no secrets are included). */
export function transportHint(err: string): string {
  const status = /HTTP (\d{3})/.exec(err)?.[1]
  if (status === '401' || status === '403')
    return `HTTP ${status}: API anahtarı geçersiz ya da Ayarlar'daki adres/modelle aynı sağlayıcıya ait değil (ör. Gemini anahtarı + OpenAI adresi).`
  if (status === '400' && /api key|api_key|API_KEY_INVALID/i.test(err)) return 'HTTP 400: API anahtarı geçersiz görünüyor.'
  if (status === '404') return "HTTP 404: model adı veya API adresi bulunamadı. Ayarlar'daki model adını kontrol edin."
  if (status === '408')
    return "HTTP 408: model belirlenen sürede yanıt vermedi. Sayfa çok uzun olabilir ya da sağlayıcı yoğun; tekrar deneyin veya Ayarlar'da daha hızlı bir model seçin."
  if (status === '429') return 'HTTP 429: kota veya hız sınırı aşıldı. Biraz bekleyip tekrar deneyin.'
  if (status && status.startsWith('5')) return `HTTP ${status}: sağlayıcı tarafında geçici hata. Tekrar deneyin.`
  return err.slice(0, 200)
}
