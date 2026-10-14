/**
 * Generates cypress/fixtures/llm-*.json: chat-completion responses used by the
 * Cypress demo in STUB mode (no API key). Segment ids are taken from the real
 * extractor output, so the stub exercises the same verification path.
 *
 * The stubs are hand-written model outputs, NOT recordings of a real model.
 * The injection stub deliberately contains one paraphrased (fabricated) quote
 * and one low-confidence finding to show what the deterministic layers do.
 * Record the submission video in LIVE mode (see README).
 *
 *   npm run build && node --import tsx scripts/make-stubs.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
// @ts-expect-error plain JS module
import { startServer } from './serve.mjs'
import { segmentText, type Segment } from '../src/core/segment'
import { screenSegments } from '../src/core/injection'
import { normalize } from '../src/core/normalize'

type F = [category: string, severity: 'low' | 'medium' | 'high', quote: string, explanation: string, confidence: number]

const CLEAN: F[] = [
  ['cancellation_refund', 'high', 'Ödenen abonelik ücretleri hiçbir koşulda iade edilmez', 'Aboneliği erken bitirseniz bile ödediğiniz para geri verilmez.', 0.95],
  ['auto_renewal', 'medium', 'iptal etmediğiniz sürece aynı süre için otomatik olarak yenilenir ve kayıtlı kartınızdan tahsil edilir', 'İptal için son tarih dönem bitiminden 30 gün önce; kaçırırsanız yeni dönem otomatik olarak kartınızdan çekilir.', 0.93],
  ['price_change', 'medium', 'abonelik ücretlerini dilediği zaman değiştirme hakkına sahiptir', 'Şirket fiyatı istediği zaman artırabilir; yeni fiyat mevcut abonelere de uygulanır.', 0.88],
  ['unilateral_termination', 'medium', 'herhangi bir sebep göstermeksizin ve önceden bildirimde bulunmaksızın hesabınızı askıya alma veya tamamen kapatma hakkını saklı tutar', 'Hesabınız gerekçe gösterilmeden ve haber verilmeden kapatılabilir; dosyalarınıza erişiminizi kaybedebilirsiniz.', 0.9],
  ['content_license', 'medium', 'dünya çapında, bedelsiz, süresiz, devredilebilir ve alt lisans verilebilir bir kullanım lisansı', 'Yüklediğiniz dosyaları şirket ücretsiz ve süresiz kullanabilir, başkalarına da kullandırabilir.', 0.86],
  ['content_removal', 'medium', 'kendi takdirine bağlı olarak bildirimde bulunmaksızın kaldırma hakkına sahiptir', 'Şirket içeriklerinizi kendi değerlendirmesine göre, size haber vermeden silebilir.', 0.8],
  ['data_sharing', 'high', 'reklam ortaklarımız, grup şirketlerimiz ve iş ortaklarımızla pazarlama ve analiz amaçlarıyla paylaşılabilir ve yurt dışına aktarılabilir', 'Kişisel verileriniz reklam amacıyla başka şirketlere verilebilir ve yurt dışına gönderilebilir.', 0.94],
  ['tracking_profiling', 'medium', 'farklı sitelerdeki davranışlarınızı takip ederek size kişiselleştirilmiş reklam göstermek amacıyla profiliniz oluşturulur', 'İnternetteki gezinmeniz izlenir ve reklam için hakkınızda bir profil çıkarılır.', 0.9],
  ['data_retention', 'medium', 'Hesabınız silinse dahi verileriniz yasal yükümlülükler ve iş ihtiyaçlarımız doğrultusunda süresiz olarak saklanabilir', 'Hesabınızı silseniz bile verileriniz belirsiz bir süre saklanmaya devam edebilir.', 0.88],
  ['liability_limitation', 'high', 'veri kaybı, hizmet kesintisi veya dosyalarınızın bozulması dahil olmak üzere doğrudan veya dolaylı hiçbir zarardan sorumlu tutulamaz', 'Dosyalarınız kaybolsa veya bozulsa bile şirket bunun zararını üstlenmez.', 0.92],
  ['unilateral_change', 'medium', 'bu Koşulları herhangi bir zamanda tek taraflı olarak değiştirebilir', 'Kurallar size sorulmadan değişebilir; kullanmaya devam etmeniz kabul sayılır.', 0.9],
  ['arbitration', 'high', 'tek hakemli tahkim yoluyla çözülecek olup Kullanıcı toplu dava açma hakkından feragat eder', 'Anlaşmazlıkta mahkeme yerine tahkime gitmeniz ve toplu davaya katılmamanız isteniyor.', 0.87],
  ['contract_by_using', 'low', 'Hizmete erişerek veya Hizmeti kullanarak bu Koşulları ve Gizlilik Politikamızı okuduğunuzu', 'Siteyi kullanmanız, metni okumasanız bile kabul ettiğiniz anlamına gelir.', 0.8],
  ['jurisdiction', 'medium', 'İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri münhasıran yetkilidir', 'Dava yalnızca İstanbul mahkemelerinde açılabilir; başka şehirde yaşıyorsanız bu sizin için zor olabilir.', 0.55],
]

const INJECTED: F[] = [
  CLEAN[0]!,
  CLEAN[1]!,
  CLEAN[6]!,
  CLEAN[9]!,
  CLEAN[11]!, // the clause the page tried to hide from AI agents
  // fabricated: plausible but NOT in the page (paraphrase of the refund clause)
  ['cancellation_refund', 'high', 'Kullanıcı hiçbir durumda ödediği parayı geri alamaz ve iptal hakkı yoktur', 'İptal hakkınız bulunmuyor.', 0.9],
  ['choice_of_law', 'low', 'Bu Koşullar Türkiye Cumhuriyeti hukukuna tabidir', 'Sözleşmeye Türk hukuku uygulanır; Türkiye’de yaşayan biri için genellikle olağandır.', 0.3],
]

function findSegment(segments: Segment[], quote: string): string {
  const q = normalize(quote)
  const s = segments.find((x) => normalize(x.text).includes(q))
  return s?.id ?? 'S1'
}

function completion(model: string, content: object) {
  return {
    id: 'chatcmpl-stub',
    object: 'chat.completion',
    model,
    choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(content) }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 0, completion_tokens: 0 },
  }
}

const server = await startServer(4197)
const browser = await chromium.launch()
mkdirSync('cypress/fixtures', { recursive: true })
for (const [file, findings, out] of [
  ['bulutkutu-kosullar.html', CLEAN, 'llm-bulutkutu.json'],
  ['bulutkutu-kosullar-injection.html', INJECTED, 'llm-bulutkutu-injection.json'],
] as const) {
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:4197/fixtures/${file}`)
  await page.addScriptTag({ url: 'http://127.0.0.1:4197/extractor.js' })
  const ex = (await page.evaluate(() => (window as any).__tosRadarExtract())) as { text: string; hidden: [] }
  const segs = screenSegments(segmentText(ex.text), ex.hidden).sanitized
  const content = {
    document_type: 'mixed_legal',
    findings: findings.map(([category, severity, quote, explanation_tr, confidence]) => ({
      segment_id: findSegment(segs, quote),
      category,
      severity,
      quote,
      explanation_tr,
      confidence,
    })),
    suspicious_instructions: [],
  }
  writeFileSync(`cypress/fixtures/${out}`, JSON.stringify(completion('stub-fixture (gerçek model değil)', content), null, 1))
  console.log(`${out}: ${content.findings.length} findings`)
  await page.close()
}
await browser.close()
server.close()
