/**
 * Mini-eval on real Terms of Service with expert labels.
 *
 *   npm run eval:rules                       # keyword baseline, no API key needed
 *   LLM_BASE_URL=... LLM_API_KEY=... LLM_MODEL=... npm run eval:llm -- --run gpt-4.1-mini
 *   npm run eval:replay -- --run gpt-4.1-mini   # re-score saved raw model outputs offline
 *
 * The LLM sees each document exactly as the extension would (one numbered
 * segment per gold sentence), goes through the full pipeline (schema, quote
 * verification, dedupe, confidence split) and is scored per sentence.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { analyze } from '../src/core/analyze'
import { ScriptedClient } from '../src/core/llm'
import { evalModelName, makeEvalClient } from './client'
import { runRules } from '../src/core/rules'
import { segmentsFromList } from '../src/core/segment'
import type { Report } from '../src/core/report'
import { CATEGORIES, type CategoryId } from '../src/core/taxonomy'
import { evaluateDoc, summarize, type DocEval, type Prediction, type Summary } from './metrics'
import type { EvalDoc } from './prepare'

const args = process.argv.slice(2)
const arg = (name: string, def?: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const mode = arg('mode', 'rules') as 'rules' | 'llm' | 'replay'
const runName = arg('run', mode === 'rules' ? 'rules-baseline' : evalModelName())!.replace(/[^\w.-]/g, '_')
const only = arg('docs')?.split(',')

const HERE = import.meta.dirname
const data = JSON.parse(readFileSync(path.join(HERE, 'data/claudette_subset.json'), 'utf8')) as { docs: EvalDoc[] }
const docs = data.docs.filter((d) => !only || only.includes(d.doc))
const runDir = path.join(HERE, 'runs', runName)
const resultsDir = path.join(HERE, 'results')
mkdirSync(resultsDir, { recursive: true })

interface RunStats {
  proposed: number
  rejected: Record<string, number>
  uncertain: number
  calls: number
  repairs: number
  failedChunks: number
  promptTokens: number
  completionTokens: number
  seconds: number
}
const stats: RunStats = { proposed: 0, rejected: {}, uncertain: 0, calls: 0, repairs: 0, failedChunks: 0, promptTokens: 0, completionTokens: 0, seconds: 0 }

function predsFromReport(r: Report, includeUncertain: boolean): Prediction[] {
  return [...r.findings, ...(includeUncertain ? r.uncertain : [])].map((f) => ({ segmentId: f.segmentId, category: f.category, quote: f.quote, confidence: f.confidence }))
}

function collect(r: Report) {
  const notDup = r.rejected.filter((x) => x.reason !== 'duplicate')
  stats.proposed += r.findings.length + r.uncertain.length + notDup.length
  for (const x of notDup) stats.rejected[x.reason] = (stats.rejected[x.reason] ?? 0) + 1
  stats.uncertain += r.uncertain.length
  stats.calls += r.trace.length
  stats.repairs += r.trace.filter((t) => t.attempt > 0).length
  stats.failedChunks += r.coverage.failedChunks
  for (const t of r.trace) {
    stats.promptTokens += t.usage?.prompt_tokens ?? 0
    stats.completionTokens += t.usage?.completion_tokens ?? 0
    stats.seconds += t.durationMs / 1000
  }
}

async function main() {
  const confident: DocEval[] = []
  const allVerified: DocEval[] = []
  let model = 'rules'

  for (const d of docs) {
    const segments = segmentsFromList(d.sentences.map((s) => s.text))
    const input = { url: `https://claudette.eval/${d.doc}`, title: `${d.doc} Terms of Service`, segments }

    if (mode === 'rules') {
      const preds = runRules(segments).map((h) => ({ segmentId: h.segmentId, category: h.category }))
      confident.push(evaluateDoc(d.doc, d.sentences, preds))
      continue
    }

    let report: Report
    if (mode === 'llm') {
      model = evalModelName()
      const client = makeEvalClient()
      process.stdout.write(`${d.doc} ... `)
      report = await analyze(input, client, { maxCharsPerCall: 20_000, maxCalls: 6, now: () => new Date() })
      mkdirSync(runDir, { recursive: true })
      writeFileSync(path.join(runDir, `${d.doc}.json`), JSON.stringify(report, null, 1))
      console.log(`${report.findings.length} findings, ${report.rejected.length} rejected, status ${report.status}`)
      if (report.status === 'failed') {
        // never write a "0 findings" result for a run that never reached the model
        console.error(`\nLLM call failed for ${d.doc}: ${report.confidence.reasons.join(' ')}\n${report.errors.join('\n')}`)
        process.exit(1)
      }
    } else {
      const file = path.join(runDir, `${d.doc}.json`)
      if (!existsSync(file)) throw new Error(`no saved run ${file}; run eval:llm first`)
      const saved = JSON.parse(readFileSync(file, 'utf8')) as Report
      model = saved.model
      // replay raw model outputs in the original order through the CURRENT pipeline
      const raws = saved.trace.map((t) => t.rawText)
      report = await analyze(input, new ScriptedClient(raws, saved.model), { maxCharsPerCall: 20_000, maxCalls: 6 })
      report.trace.forEach((t, i) => {
        t.usage = saved.trace[i]?.usage
        t.durationMs = saved.trace[i]?.durationMs ?? 0
      })
    }
    collect(report)
    confident.push(evaluateDoc(d.doc, d.sentences, predsFromReport(report, false)))
    allVerified.push(evaluateDoc(d.doc, d.sentences, predsFromReport(report, true)))
  }

  const sConf = summarize(confident)
  const sAll = allVerified.length ? summarize(allVerified) : null
  const md = renderMarkdown(model, sConf, sAll, confident)
  writeFileSync(path.join(resultsDir, `${runName}.md`), md)
  writeFileSync(path.join(resultsDir, `${runName}.json`), JSON.stringify({ model, mode, docs: docs.map((d) => d.doc), summary: sConf, summaryInclUncertain: sAll, stats: mode === 'rules' ? null : stats, perDoc: confident }, null, 1))
  console.log(md.split('\n## Belge bazında')[0])
  console.log(`\nwritten eval/results/${runName}.md`)
}

const pct = (x: number) => `${(100 * x).toFixed(1)}%`
const cut = (s: string, n = 180) => (s.length > n ? `${s.slice(0, n)}…` : s)

function renderMarkdown(model: string, s: Summary, sAll: Summary | null, evals: DocEval[]): string {
  const L: string[] = []
  L.push(`# Eval sonucu: ${runName}`, '')
  L.push(`- Mod: \`${mode}\` · Model: \`${model}\``)
  L.push(`- Korpus: ${evals.length} gerçek ToS, ${evals.reduce((a, e) => a + e.sentences, 0)} cümle, ${evals.reduce((a, e) => a + e.goldUnfair, 0)} uzman etiketli haksız madde (CLAUDETTE)`)
  L.push(`- Birim: cümle. Yakalanan = haksız etiketli cümle, CLAUDETTE karşılığı olan bir kategoriyle işaretlendi.`, '')
  L.push('| Metrik | Değer |', '|---|---|')
  L.push(`| Yakalanan (TP) | ${s.tp} |`, `| Kaçırılan (FN) | ${s.fn} |`, `| Yanlış alarm (FP) | ${s.fp} |`)
  L.push(`| Precision | ${pct(s.precision)} |`, `| Recall | ${pct(s.recall)} |`, `| F1 | ${pct(s.f1)} |`)
  L.push(`| Yakalananlarda kategori de doğru | ${s.categoryMatch}/${s.tp} |`)
  L.push(`| Taksonomi dışı işaret (veri paylaşımı, otomatik yenileme vb.; skora katılmaz) | ${s.outOfTaxonomy} (bunlardan ${s.outOfTaxonomyOnGoldUnfair} tanesi zaten haksız etiketli cümle) |`)
  if (sAll) L.push(`| Düşük güvenli bulgular dahil edilirse P / R / F1 | ${pct(sAll.precision)} / ${pct(sAll.recall)} / ${pct(sAll.f1)} |`)
  L.push('')
  if (mode !== 'rules') {
    const rej = Object.values(stats.rejected).reduce((a, b) => a + b, 0)
    L.push('### Doğrulama katmanı', '')
    L.push('| | |', '|---|---|')
    L.push(`| Modelin önerdiği bulgu | ${stats.proposed} |`)
    L.push(`| Alıntısı doğrulanamadığı için reddedilen | ${rej} (${stats.proposed ? pct(rej / stats.proposed) : '-'}) |`)
    for (const [k, v] of Object.entries(stats.rejected)) L.push(`| ↳ ${k} | ${v} |`)
    L.push(`| Düşük güven (<0.6) nedeniyle skordan ayrılan | ${stats.uncertain} |`)
    L.push(`| LLM çağrısı / onarım denemesi / başarısız parça | ${stats.calls} / ${stats.repairs} / ${stats.failedChunks} |`)
    L.push(`| Token (girdi / çıktı) | ${stats.promptTokens} / ${stats.completionTokens} |`)
    L.push(`| Toplam model süresi | ${stats.seconds.toFixed(0)} sn |`, '')
  }
  L.push('### Kategori bazında', '', '| Kod | Kategori | TP | FP | FN | P | R | F1 |', '|---|---|---|---|---|---|---|---|')
  for (const [code, v] of Object.entries(s.perCode)) {
    const cat = (Object.keys(CATEGORIES) as CategoryId[]).find((c) => CATEGORIES[c].claudette === code)!
    L.push(`| ${code} | ${CATEGORIES[cat].label} | ${v.tp} | ${v.fp} | ${v.fn} | ${pct(v.precision)} | ${pct(v.recall)} | ${pct(v.f1)} |`)
  }
  L.push('', '## Belge bazında', '')
  for (const e of evals) {
    L.push(`### ${e.doc} — yakalanan ${e.caught.length}, kaçırılan ${e.missed.length}, yanlış alarm ${e.falseAlarms.length}`, '')
    if (e.caught.length) {
      L.push('<details><summary>Yakalanan</summary>', '')
      for (const c of e.caught) L.push(`- **${c.segmentId}** altın: ${c.gold.join(',')} · tahmin: ${c.predicted.join(',')} — ${cut(c.text)}`)
      L.push('', '</details>', '')
    }
    if (e.missed.length) {
      L.push('**Kaçırılan**', '')
      for (const m of e.missed) L.push(`- **${m.segmentId}** (${m.gold.join(',')}) — ${cut(m.text)}`)
      L.push('')
    }
    if (e.falseAlarms.length) {
      L.push('**Yanlış alarm**', '')
      for (const f of e.falseAlarms) L.push(`- **${f.segmentId}** (tahmin: ${f.predicted.join(',')}) — ${cut(f.text)}`)
      L.push('')
    }
    if (e.outOfTaxonomy.length) {
      L.push('<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>', '')
      for (const o of e.outOfTaxonomy) L.push(`- **${o.segmentId}** (${o.categories.join(',')})${o.goldUnfair ? ' [altın: haksız]' : ''} — ${cut(o.text)}`)
      L.push('', '</details>', '')
    }
  }
  return L.join('\n')
}

await main()
