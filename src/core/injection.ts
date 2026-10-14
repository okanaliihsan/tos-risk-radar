/**
 * Prompt-injection screening for untrusted page text.
 *
 * Layer 1 of the injection defence (see README "Güvenlik"):
 *   - hidden text never reaches the model (handled by the extractor);
 *   - visible segments that look like instructions to an AI are quarantined:
 *     replaced with a placeholder in the model input and listed in the report.
 *
 * The heuristics are deliberately conservative about what counts as "strong";
 * legal text rarely addresses an AI model, so false positives are rare and,
 * when they happen, they are shown to the user rather than hidden.
 */
import { normalize } from './normalize'
import type { Segment } from './segment'

interface Signal {
  id: string
  re: RegExp
  weight: 1 | 2
}

const SIGNALS: Signal[] = [
  // direct override attempts
  { id: 'ignore_previous', weight: 2, re: /\b(?:ignore|disregard|forget|override|bypass)\b[^.]{0,40}\b(?:previous|prior|above|earlier|all|any|system|your)\b[^.]{0,30}\b(?:instruction|instructions|prompt|prompts|rules|directions|guidelines)\b/ },
  { id: 'ignore_previous_tr', weight: 2, re: /(?:onceki|yukaridaki|tum|butun|sistem)[^.]{0,30}(?:talimat|komut|yonerge|kural)\S*[^.]{0,30}(?:yok say|gormezden gel|unut(?:un)?\b|dikkate alma(?:yin)?\b)/ },
  // addressing the model / role play
  { id: 'addresses_ai', weight: 2, re: /\b(?:you are|act as|as an?|dear|attention|note to|hey|to the|for the)\b[^.]{0,20}\b(?:ai|a\.i\.|llm|large language model|language model|chatbot|gpt|chatgpt|claude|gemini|ai (?:assistant|agent|model|system|tool)|(?:risk |document |terms )?(?:analy[sz]er|summari[sz]er))\b/ },
  { id: 'vocative_ai', weight: 2, re: /(?:^|[.!?]\s)(?:ai|llm|gpt|ai agent|ai assistant|ai model|assistant|agent|bot|model)\s*[:,]/ },
  { id: 'vocative_ai_tr', weight: 2, re: /(?:^|[.!?]\s)(?:asistan|yapay zeka|yapay zeka asistani|dil modeli|model|ajan|bot)\s*[:,]/ },
  { id: 'note_to_ai_tr', weight: 2, re: /(?:yapay zeka|dil modeli|llm|asistan|ozetleme|analiz)\S*(?: \S+){0,2} icin (?:not|talimat|uyari)\b/ },
  { id: 'addresses_ai_tr', weight: 2, re: /(?:yapay zeka|dil modeli|llm|asistan|analiz (?:araci|eden)|ozetleyici)\S*[^.]{0,40}(?:talimat|\bsen\b|\bdikkat\b|yanit ver|cevap ver|yanitini|raporla|\byaz\b)/ },
  // role / prompt-format markers
  { id: 'role_markers', weight: 2, re: /<\/?(?:system|assistant|user|instructions?|im_start|im_end)>|\[\/?inst\]|<\|im_(?:start|end)\|>|\b(?:system|developer) (?:prompt|message|instruction)s?\b|###\s*(?:system|instruction)/ },
  // attempts to steer the output
  { id: 'steer_score', weight: 2, re: /\b(?:risk|safety|overall)\s*(?:score|level|rating)\b[^.]{0,50}\b(?:0|zero|none|low|minimal|safe|100|10\/10)\b/ },
  { id: 'steer_score_tr', weight: 2, re: /(?:risk|guven)\S* (?:skor|puan|seviye)\S*[^.]{0,50}(?:0|sifir|dusuk|guvenli|yok)/ },
  { id: 'suppress_findings', weight: 2, re: /\b(?:do not|don't|never|must not)\b[^.]{0,20}\b(?:report|flag|mention|list|highlight|include|output)\b[^.]{0,40}\b(?:clause|clauses|risk|risks|finding|findings|this|section|anything)\b/ },
  { id: 'suppress_findings_tr', weight: 2, re: /(?:raporlama|bildirme|isaretleme|listeleme|belirtme)[^.]{0,30}(?:madde|risk|bunu|bu bolum)|(?:madde|risk)\S*[^.]{0,30}(?:raporlama|bildirme|isaretleme)/ },
  { id: 'output_format', weight: 1, re: /\b(?:respond|reply|output|answer|return|print)\b[^.]{0,15}\b(?:only|with|in json|exactly|the following)\b/ },
  { id: 'output_format_tr', weight: 1, re: /(?:sadece|yalnizca)[^.]{0,40}(?:yanit ver|cevap ver|yaz|dondur|cikti|ile ver|listesiyle ver|olarak ver)/ },
  // agentic actions (relevant because page-agent CAN act on pages)
  { id: 'agent_action', weight: 1, re: /\b(?:click|press|tap|submit|navigate to|open|visit|fill in|type)\b[^.]{0,30}\b(?:button|link|subscribe|accept|confirm|url|http|form)\b/ },
  { id: 'agent_action_tr', weight: 1, re: /\b(?:tikla(?:yin)?|bas(?:in)?|gonder(?:in)?|abone ol(?:un)?|onayla(?:yin)?|git(?:in)?)\b[^.]{0,30}(?:buton|dugme|baglanti|link|form)|(?:buton|dugme|baglanti)\S*[^.]{0,30}\b(?:tikla(?:yin)?|bas(?:in)?)\b/ },
  { id: 'exfil_to_output', weight: 2, re: /\b(?:api[_ ]?key|system prompt|password|token|credentials?)\b[^.]{0,60}\b(?:in|into|inside|to) (?:the |your )?(?:explanation|response|output|answer|json|field|report|finding|summary)/ },
  { id: 'secret_exfil', weight: 1, re: /\b(?:api[_ ]?key|password|token|cookie|credentials?)\b[^.]{0,40}\b(?:send|reveal|print|output|share|post)\b|\b(?:send|reveal|print|output|share|post)\b[^.]{0,40}\b(?:api[_ ]?key|password|token|credentials?)\b/ },
  { id: 'new_instructions', weight: 1, re: /\b(?:new|updated|real|actual|important) instructions?\b|\binstead,? (?:you|say|write|output)\b/ },
  { id: 'new_instructions_tr', weight: 1, re: /(?:yeni|gercek|asil|onemli) talimat/ },
]

function asciiFold(s: string): string {
  return s.replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u')
}

export interface InjectionScan {
  score: number
  signals: string[]
}

export function scanForInjection(text: string): InjectionScan {
  const t = asciiFold(normalize(text))
  const signals = SIGNALS.filter((s) => s.re.test(t))
  return { score: signals.reduce((a, s) => a + s.weight, 0), signals: signals.map((s) => s.id) }
}

/** A segment is quarantined when the evidence is strong (score >= 2). */
export const QUARANTINE_THRESHOLD = 2

export interface HiddenBlock {
  text: string
  /** why the extractor considers it hidden, e.g. "display:none", "html-comment", "offscreen" */
  how: string
}

export interface SuspiciousItem {
  source: 'visible' | 'hidden'
  segmentId: string | null
  text: string
  signals: string[]
  how?: string
}

export interface ScreenResult {
  /** segments to send to the model, with quarantined ones replaced */
  sanitized: Segment[]
  quarantinedIds: string[]
  suspicious: SuspiciousItem[]
}

export function quarantinePlaceholder(id: string): string {
  return `[${id} removed by the extension: text that addresses an AI system was quarantined and is not part of the analysis]`
}

export function screenSegments(segments: Segment[], hidden: HiddenBlock[] = []): ScreenResult {
  const sanitized: Segment[] = []
  const quarantinedIds: string[] = []
  const suspicious: SuspiciousItem[] = []

  for (const seg of segments) {
    const scan = scanForInjection(seg.text)
    if (scan.score >= QUARANTINE_THRESHOLD) {
      quarantinedIds.push(seg.id)
      suspicious.push({ source: 'visible', segmentId: seg.id, text: seg.text, signals: scan.signals })
      sanitized.push({ id: seg.id, text: quarantinePlaceholder(seg.id) })
    } else {
      sanitized.push(seg)
    }
  }
  for (const block of hidden) {
    const scan = scanForInjection(block.text)
    if (scan.score >= QUARANTINE_THRESHOLD) {
      suspicious.push({ source: 'hidden', segmentId: null, text: block.text.slice(0, 600), signals: scan.signals, how: block.how })
    }
  }
  return { sanitized, quarantinedIds, suspicious }
}

/**
 * Hidden text that a human CAN reveal (collapsed accordions, tabs, screen-reader
 * text) is part of the contract, so it is analysed unless it looks like an
 * instruction. Text hidden with purely deceptive techniques (same colour as
 * the background, 1px font, transparent, off-screen, comments, attributes)
 * is never analysed.
 */
const RESTORABLE_HOW = new Set(['css-hidden', 'clipped'])

export function restorableHidden(hidden: HiddenBlock[], visibleText: string): string[] {
  const visible = normalize(visibleText)
  const seen = new Set<string>()
  const out: string[] = []
  for (const h of hidden) {
    if (!RESTORABLE_HOW.has(h.how) || h.text.length < 40) continue
    if (scanForInjection(h.text).score >= QUARANTINE_THRESHOLD) continue
    const n = normalize(h.text)
    if (visible.includes(n) || seen.has(n)) continue
    seen.add(n)
    out.push(h.text)
  }
  return out
}
