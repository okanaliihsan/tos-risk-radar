/**
 * Report renderer shared by the extension popup and the dev harness.
 *
 * Everything that came from the page or from the model is untrusted, so it is
 * only ever inserted with textContent (never innerHTML) and never rendered as a
 * link. That closes the "model output -> XSS in extension page" path.
 */
import type { Report, VerifiedFinding } from '../core/report'
import { CATEGORIES } from '../core/taxonomy'
import { DISCLAIMER_TR } from '../core/report'

type Child = Node | string | null | undefined | false
function h(tag: string, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    el.append(typeof c === 'string' ? document.createTextNode(c) : c)
  }
  return el
}

const SEVERITY_TR = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' } as const
const CONF_TR = { high: 'Yüksek güven', medium: 'Orta güven — dikkatle okuyun', low: 'Düşük güven — bu rapora tek başına güvenmeyin' } as const
const DOC_TR: Record<string, string> = {
  terms_of_service: 'Kullanım koşulları',
  privacy_policy: 'Gizlilik politikası',
  subscription_terms: 'Abonelik şartları',
  mixed_legal: 'Karma sözleşme metni',
  not_legal: 'Sözleşme metni değil',
}
const REJECT_TR: Record<string, string> = {
  quote_not_found: 'Alıntı sayfada birebir bulunamadı',
  unknown_segment_and_not_found: 'Var olmayan bölüm + alıntı bulunamadı',
  quote_too_short: 'Alıntı çok kısa (en az 5 kelime)',
  ellipsis_fragment_too_short: '"..." ile birleştirilmiş parçalar çok kısa',
  quote_from_quarantined_segment: 'Karantinaya alınmış (talimat içeren) metinden alıntı',
  duplicate: 'Aynı madde için tekrar',
}
const HOW_TR: Record<string, string> = {
  'css-hidden': 'CSS ile gizli',
  'tiny-font': 'çok küçük yazı',
  'zero-size': 'sıfır boyut',
  'off-screen': 'ekran dışı',
  clipped: 'kırpılmış',
  'transparent-text': 'saydam yazı',
  'same-colour-as-background': 'arka planla aynı renk',
  'html-comment': 'HTML yorumu',
}

export function renderDisclaimer(): HTMLElement {
  return h('div', { class: 'disclaimer', role: 'note', 'data-cy': 'disclaimer' }, h('strong', {}, 'Hukuki tavsiye değildir. '), DISCLAIMER_TR)
}

function findingCard(f: VerifiedFinding, kind: 'main' | 'uncertain'): HTMLElement {
  const cat = CATEGORIES[f.category]
  return h(
    'article',
    { class: `finding sev-${f.severity} ${kind}`, 'data-cy': kind === 'main' ? 'finding' : 'uncertain-finding', 'data-category': f.category },
    h(
      'header',
      {},
      h('span', { class: `chip sev-${f.severity}` }, SEVERITY_TR[f.severity]),
      h('span', { class: 'cat' }, cat.label),
    ),
    h('p', { class: 'explain' }, f.explanationTr),
    h('blockquote', { class: 'quote', 'data-cy': 'quote', title: f.context }, `“${f.quote}”`),
    h(
      'footer',
      {},
      h('span', { class: 'verified', title: 'Alıntı sayfadaki metinle birebir eşleşti' }, `✓ Sayfada doğrulandı · ${f.segmentId}`),
      h('span', {}, `Model güveni %${Math.round(f.confidence * 100)}`),
      f.ruleAgreement ? h('span', { class: 'rule' }, 'Kural taramasıyla da eşleşti') : null,
      f.segmentCorrected ? h('span', { class: 'warn' }, 'Model yanlış bölüm numarası verdi; düzeltildi') : null,
    ),
  )
}

function details(summary: string, cy: string, open: boolean, ...children: Child[]): HTMLElement {
  const d = h('details', { 'data-cy': cy }, h('summary', {}, summary), ...children)
  if (open) d.setAttribute('open', '')
  return d
}

export function renderReport(report: Report, extra?: { extractor?: string }): HTMLElement {
  const root = h('div', { class: 'report', 'data-cy': 'report', 'data-status': report.status, 'data-confidence': report.confidence.level })
  root.append(renderDisclaimer())

  // Header: score (deterministic) + band + document type
  const scoreBox = h(
    'section',
    { class: `score band-${report.score.band}`, 'data-cy': 'score' },
    h('div', { class: 'score-num', 'data-cy': 'score-value' }, report.status === 'failed' || report.status === 'insufficient_text' ? '—' : String(report.score.value)),
    h(
      'div',
      { class: 'score-meta' },
      h('div', { class: 'band' }, report.status === 'failed' ? 'Skor hesaplanamadı' : `Risk: ${report.score.bandLabel}`),
      h('div', { class: 'doctype' }, report.documentType ? DOC_TR[report.documentType] ?? report.documentType : ''),
      h('div', { class: 'counts' }, `${report.findings.length} doğrulanmış riskli madde`),
    ),
  )
  root.append(scoreBox)

  // Honest uncertainty
  root.append(
    h(
      'section',
      { class: `confidence conf-${report.confidence.level}`, 'data-cy': 'confidence' },
      h('div', { class: 'conf-title' }, CONF_TR[report.confidence.level]),
      h('ul', {}, ...report.confidence.reasons.map((r) => h('li', {}, r))),
    ),
  )

  // Security
  const sec = report.security
  if (sec.suspicious.length || sec.modelReported.length || sec.cloakedBlocks.length) {
    const items: HTMLElement[] = []
    for (const s of sec.suspicious) {
      items.push(
        h(
          'li',
          {},
          h('span', { class: 'chip danger' }, s.source === 'hidden' ? `Gizli metin (${HOW_TR[s.how ?? ''] ?? s.how})` : `Görünür metin · ${s.segmentId} · karantinada`),
          h('code', {}, s.text.length > 220 ? `${s.text.slice(0, 220)}…` : s.text),
        ),
      )
    }
    for (const m of sec.modelReported) {
      items.push(h('li', {}, h('span', { class: 'chip warn' }, `Model de bildirdi · ${m.segmentId}${m.verified ? '' : ' · doğrulanamadı'}`), h('code', {}, m.quote)))
    }
    for (const c of sec.cloakedBlocks) {
      items.push(h('li', {}, h('span', { class: 'chip warn' }, 'Yapay zekâdan gizlenmiş görünür metin (analize eklendi)'), h('code', {}, c.length > 220 ? `${c.slice(0, 220)}…` : c)))
    }
    root.append(
      h(
        'section',
        { class: 'security', 'data-cy': 'security' },
        h('div', { class: 'sec-title' }, '⚠ Sayfada yapay zekâya yönelik talimat / manipülasyon girişimi'),
        h('p', {}, 'Bu metinler talimat olarak uygulanmadı ve skoru etkilemedi. Sitenin, otomatik analiz araçlarını yanıltmaya çalışmış olabileceğini aklınızda tutun.'),
        h('ul', {}, ...items),
      ),
    )
  }

  // Findings
  const list = h('section', { class: 'findings' }, h('h2', {}, 'Riskli maddeler'))
  if (!report.findings.length) {
    list.append(
      h(
        'p',
        { class: 'empty', 'data-cy': 'no-findings' },
        report.status === 'ok' || report.status === 'partial'
          ? 'Doğrulanmış riskli madde bulunamadı. Bu, metnin risksiz olduğu anlamına gelmez; aşağıdaki "kontrol edin" bölümüne bakın.'
          : 'Bulgu üretilemedi.',
      ),
    )
  }
  for (const f of report.findings) list.append(findingCard(f, 'main'))
  root.append(list)

  if (report.uncertain.length) {
    root.append(details(`Belirsiz bulgular (${report.uncertain.length}) — skora dahil değil`, 'uncertain', false, ...report.uncertain.map((f) => findingCard(f, 'uncertain'))))
  }
  if (report.possiblyMissed.length) {
    root.append(
      details(
        `Kontrol edin: modelin raporlamadığı olası maddeler (${report.possiblyMissed.length})`,
        'possibly-missed',
        report.findings.length === 0,
        h('p', { class: 'hint' }, 'Basit anahtar kelime kuralları bu cümleleri işaretledi ama model raporlamadı. Yanlış alarm olabilirler; kendiniz okuyun.'),
        ...report.possiblyMissed.map((m) => h('div', { class: 'missed' }, h('span', { class: 'chip' }, `${CATEGORIES[m.category].label} · ${m.segmentId}`), h('blockquote', { class: 'quote' }, m.text))),
      ),
    )
  }
  const realRejections = report.rejected.filter((r) => r.reason !== 'duplicate')
  if (realRejections.length) {
    root.append(
      details(
        `Doğrulanamayan model iddiaları (${realRejections.length}) — gösterilmedi`,
        'rejected',
        false,
        h('p', { class: 'hint' }, 'Alıntısı sayfada bulunamayan iddialar geçersiz sayılır ve skora katılmaz.'),
        ...realRejections.map((r) =>
          h('div', { class: 'rejected' }, h('span', { class: 'chip danger' }, REJECT_TR[r.reason] ?? r.reason), h('span', { class: 'cat' }, CATEGORIES[r.category].label), h('s', {}, r.modelQuote)),
        ),
      ),
    )
  }
  if (report.score.breakdown.length) {
    root.append(
      details(
        'Skor nasıl hesaplandı?',
        'breakdown',
        false,
        h('p', { class: 'hint' }, 'Skoru model değil, sabit bir kural hesaplar: her kategori için en ağır bulgu (Düşük 6, Orta 12, Yüksek 20) + aynı kategorideki her ek bulgu için 2 puan (en fazla 4); toplam en fazla 100.'),
        h('table', {}, ...report.score.breakdown.map((b) => h('tr', {}, h('td', {}, CATEGORIES[b.category].label), h('td', {}, `${SEVERITY_TR[b.maxSeverity]} ×${b.count}`), h('td', {}, `+${b.points}`)))),
      ),
    )
  }

  const c = report.coverage
  root.append(
    h(
      'footer',
      { class: 'meta' },
      `Model: ${report.model} · ${c.segmentsAnalyzed}/${c.segmentsTotal} bölüm analiz edildi · ${c.chunks} çağrı${c.failedChunks ? ` (${c.failedChunks} başarısız)` : ''} · ${new Date(report.analyzedAt).toLocaleString('tr-TR')}`,
      extra?.extractor ? h('div', {}, `Metin çıkarıcı: ${extra.extractor}`) : null,
    ),
  )
  return root
}

export function renderProgress(text: string): HTMLElement {
  return h('div', { class: 'progress', 'data-cy': 'progress' }, h('div', { class: 'spinner' }), text)
}

export function renderError(message: string): HTMLElement {
  return h('div', { class: 'error', 'data-cy': 'error' }, message)
}
