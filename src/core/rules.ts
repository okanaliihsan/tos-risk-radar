/**
 * Rule-based clause detector (English + Turkish keyword patterns).
 *
 * It has two jobs:
 *  1. Eval baseline that needs no API key, so the LLM's added value is measurable.
 *  2. Cross-check at runtime: segments the rules flag but the LLM did not report
 *     are surfaced as "possibly missed" instead of being silently dropped.
 *
 * Patterns run on normalised text (lower-case, folded quotes, ı/İ -> i).
 */
import { normalize } from './normalize'
import type { Segment } from './segment'
import type { CategoryId } from './taxonomy'

type Pattern = RegExp

const R: Record<CategoryId, Pattern[]> = {
  arbitration: [
    /\barbitrat(?:ion|or|ors|e|ed)\b/,
    /\bclass[- ]action\b/,
    /\bclass[- ]wide\b/,
    /\bjury trial\b/,
    /\btahkim\b/,
    /\btoplu dava\b/,
    /\bdava (?:açma )?hakk\S* (?:feragat|vazge)/,
  ],
  unilateral_change: [
    /\b(?:may|can|will|reserve[s]? the right to|right to)\b[^.]{0,60}\b(?:modify|change|amend|revise|update|alter)\b[^.]{0,80}\b(?:terms|agreement|policy|conditions|these)\b/,
    /\b(?:terms|agreement|policy)\b[^.]{0,60}\b(?:may|can) be (?:modified|changed|amended|updated|revised)\b/,
    /\bat (?:any time|our (?:sole )?discretion)\b[^.]{0,80}\b(?:modify|change|amend|revise|update)\b/,
    /\bcontinued use\b[^.]{0,80}\b(?:accept|agree|constitute)/,
    /(?:sartlar|kosullar|sozlesme|politika)\S*[^.]{0,80}(?:degistirme hakk|tek tarafl\S* (?:olarak )?degis|herhangi bir zamanda degis|dilediği zaman degis|diledigi zaman degis|guncelleme hakk)/,
    /(?:degistirebilir|guncelleyebilir)[^.]{0,40}(?:bildirim(?:de bulunmaksizin)?|onceden haber)/,
  ],
  content_removal: [
    /\b(?:remove|delete|disable|block|take down)\b[^.]{0,80}\b(?:content|material|post|posts|submissions|uploads)\b[^.]{0,80}\b(?:any reason|sole discretion|without (?:prior )?notice|at any time)\b/,
    /\b(?:sole discretion|any reason|at any time)\b[^.]{0,80}\b(?:remove|delete|refuse to (?:post|display))\b/,
    /icerig\S*[^.]{0,60}(?:kaldirma|silme|engelleme) hakk/,
  ],
  jurisdiction: [
    /\b(?:exclusive|sole) (?:jurisdiction|venue)\b/,
    /\bcourts? (?:located )?(?:in|of)\b[^.]{0,60}\b(?:shall|will) have (?:exclusive )?jurisdiction\b/,
    /\bsubmit to the (?:personal |exclusive )?jurisdiction\b/,
    /\bvenue\b[^.]{0,60}\b(?:shall|will) be\b/,
    /(?:mahkemeleri|icra daireleri)[^.]{0,40}yetkili/,
    /yetkili mahkeme/,
  ],
  choice_of_law: [
    /\bgoverned by (?:and construed in accordance with )?the laws? of\b/,
    /\b(?:laws?|law) of the state of\b[^.]{0,60}\b(?:govern|apply|applies)\b/,
    /\bconstrued in accordance with the laws?\b/,
    /\bchoice of law\b/,
    /\b(?:hukuku|kanunlari)[^.]{0,30}uygulan/,
    /\btabi olacak(?:tir)?\b[^.]{0,30}hukuk|hukukuna tabi/,
  ],
  liability_limitation: [
    /\b(?:not|in no event|under no circumstances)\b[^.]{0,80}\b(?:be )?(?:liable|responsible)\b/,
    /\b(?:limitation|exclusion|disclaimer) of (?:liability|warranties|damages)\b/,
    /\bas is\b[^.]{0,30}\b(?:as available|without warrant)/,
    /\b(?:aggregate|total|maximum) liability\b/,
    /\bdisclaim(?:s)? (?:all|any)\b/,
    /\b(?:indirect|incidental|consequential|special|punitive) damages\b/,
    /sorumlu (?:degil|tutulamaz|olmayacak|olmaz)/,
    /sorumlulu\S* (?:kabul etmez|bulunmamaktadir|yoktur|sinirli)/,
    /hicbir (?:sekilde |kosulda )?sorumlu/,
    /oldugu gibi/,
  ],
  unilateral_termination: [
    /\b(?:suspend|terminate|disable|close|deactivate|cancel)\b[^.]{0,80}\b(?:account|access|service|services|membership|subscription)\b[^.]{0,80}\b(?:any reason|sole discretion|without (?:prior )?notice|at any time|without cause|for any or no reason)\b/,
    /\b(?:at any time|sole discretion|for any reason)\b[^.]{0,80}\b(?:suspend|terminate|disable|deactivate)\b/,
    /hesab\S*[^.]{0,80}(?:askiya alma|kapatma|feshetme|sonlandirma)[^.]{0,40}hakk/,
    /(?:bildirimde bulunmaksizin|herhangi bir sebep gostermeksizin|gerekce gostermeksizin)[^.]{0,80}(?:kapat|askiya|fesh|sonland)/,
  ],
  contract_by_using: [
    /\bby (?:using|accessing|visiting|downloading|installing|browsing|registering)\b[^.]{0,80}\b(?:you )?(?:agree|accept|consent|acknowledge)\b/,
    /\b(?:use|access) of (?:the|our) (?:service|services|site|website|app)\b[^.]{0,60}\b(?:constitutes|signifies|means)\b[^.]{0,30}\b(?:acceptance|agreement)\b/,
    /\bif you do not agree\b[^.]{0,60}\b(?:do not|don't|may not) (?:use|access)\b/,
    /(?:kullanarak|erisarak|ziyaret ederek|kullanmanız|kullanmaniz)[^.]{0,80}(?:kabul etmis|onaylamis|kabul ettiginiz)/,
  ],
  privacy_by_using: [
    /\bby using\b[^.]{0,80}\b(?:privacy policy|collection|processing|use of (?:your )?(?:personal )?(?:data|information))\b/,
    /\b(?:you )?consent to\b[^.]{0,60}\b(?:collection|processing|transfer|use)\b[^.]{0,40}\b(?:data|information)\b/,
    /\bprivacy policy\b[^.]{0,60}\b(?:is incorporated|forms part|part of these terms)\b/,
    /gizlilik politika\S*[^.]{0,80}(?:kabul etmis|onaylamis|ayrilmaz parca)/,
  ],
  data_sharing: [
    /\b(?:share|sell|disclose|transfer|provide|rent)\b[^.]{0,60}\b(?:personal )?(?:data|information)\b[^.]{0,60}\b(?:third[- ]part(?:y|ies)|partners|affiliates|advertisers)\b/,
    /\b(?:third[- ]part(?:y|ies)|partners|affiliates|advertisers)\b[^.]{0,60}\b(?:share|sell|disclose|transfer|receive)\b[^.]{0,40}\b(?:data|information)\b/,
    /\bsell (?:your )?(?:personal )?(?:data|information)\b/,
    /(?:ucuncu (?:taraf|kisi)|is ortak|reklam ortak|grup sirket)\S*[^.]{0,80}(?:paylas|aktar|sat)/,
    /(?:verileriniz|kisisel veri)\S*[^.]{0,80}(?:paylas|aktar|sat)\S*/,
  ],
  data_retention: [
    /\b(?:retain|keep|store)\b[^.]{0,60}\b(?:indefinitely|as long as (?:necessary|we deem)|after (?:you )?(?:delete|close|terminate))\b/,
    /\b(?:even )?after (?:your )?account (?:is )?(?:deleted|closed|terminated)\b[^.]{0,60}\b(?:retain|keep|store)/,
    /(?:suresiz|sinirsiz sure|belirsiz sure)[^.]{0,40}(?:sakla|muhafaza)/,
    /hesab\S* (?:silin|kapatil)\S*[^.]{0,80}(?:sakla|muhafaza)/,
  ],
  tracking_profiling: [
    /\b(?:cookies|tracking technologies|pixels|web beacons|device identifiers|fingerprint)\b[^.]{0,80}\b(?:advertis|track|profile|personaliz|across)\b/,
    /\b(?:targeted|personalized|interest[- ]based|behavioural|behavioral) (?:advertising|ads)\b/,
    /\b(?:profile|profiling)\b[^.]{0,40}\b(?:you|users|your)\b/,
    /(?:cerez|izleme teknoloji|piksel)\S*[^.]{0,80}(?:reklam|profil|takip)/,
    /(?:hedefli|kisisellestirilmis) reklam/,
    /profil(?:leme|iniz)/,
  ],
  auto_renewal: [
    /\b(?:automatically|auto[- ]?)renew/,
    /\brenew(?:s|ed)? automatically\b/,
    /\brecurring (?:billing|charge|payment)s?\b/,
    /\buntil (?:you )?cancel\b/,
    /otomatik (?:olarak )?yenilen/,
    /iptal (?:edilmedikce|etmediginiz surece)/,
  ],
  cancellation_refund: [
    /\bnon[- ]refundable\b/,
    /\bno refunds?\b/,
    /\b(?:will|shall) not (?:be )?refund/,
    /\bcancellation fee\b/,
    /\b(?:early )?termination fee\b/,
    /iade (?:edilmez|yapilmaz|edilmeyecek|yoktur)/,
    /(?:cayma hakki|iade hakki)[^.]{0,40}(?:bulunmamaktadir|yoktur|kullanilamaz)/,
    /iptal (?:ucreti|bedeli)/,
  ],
  price_change: [
    /\b(?:change|modify|increase|adjust)\b[^.]{0,40}\b(?:price|prices|fees|pricing|subscription fee|charges)\b/,
    /\b(?:price|prices|fees|pricing)\b[^.]{0,40}\b(?:subject to change|may change|may be changed|may increase)\b/,
    /(?:fiyat|ucret)\S*[^.]{0,60}(?:degistirme hakk|degisiklik yapma hakk|artir)/,
  ],
  content_license: [
    /\b(?:worldwide|royalty[- ]free|perpetual|irrevocable|sublicensable|transferable)\b[^.]{0,80}\b(?:licen[cs]e|right to use)\b/,
    /\blicen[cs]e\b[^.]{0,80}\b(?:worldwide|royalty[- ]free|perpetual|irrevocable|sublicensable)\b/,
    /(?:dunya capinda|bedelsiz|suresiz|geri alinamaz)[^.]{0,60}lisans/,
  ],
}

/** Turkish letters are folded to ASCII for the TR patterns above. */
function asciiFold(s: string): string {
  return s
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[âà]/g, 'a')
    .replace(/[îì]/g, 'i')
    .replace(/[ûù]/g, 'u')
}

export interface RuleHit {
  segmentId: string
  category: CategoryId
  pattern: string
}

export function runRules(segments: Segment[]): RuleHit[] {
  const hits: RuleHit[] = []
  for (const seg of segments) {
    const text = asciiFold(normalize(seg.text))
    for (const [category, patterns] of Object.entries(R) as [CategoryId, Pattern[]][]) {
      const p = patterns.find((re) => re.test(text))
      if (p) hits.push({ segmentId: seg.id, category, pattern: p.source })
    }
  }
  return hits
}
