/**
 * Cheap URL/title heuristic used to light up the toolbar badge when the user
 * opens what looks like terms, a privacy policy or subscription conditions.
 * It never sends anything anywhere; analysis starts only on user click.
 */
export type LegalKind = 'terms' | 'privacy' | 'subscription' | 'cookies'

const PATTERNS: [LegalKind, RegExp][] = [
  ['privacy', /privacy|gizlilik|kvkk|aydinlatma|aydınlatma|kisisel-veri|kişisel-veri|data-protection|datenschutz/i],
  ['cookies', /cookie|cerez|çerez/i],
  ['subscription', /subscription|abonelik|uyelik-sozlesmesi|üyelik-sözleşmesi|billing-terms|renewal|membership-terms/i],
  ['terms', /terms|\btos\b|conditions|legal|agreement|eula|kullanim-kosul|kullanım-koşul|kullanim_kosul|sozlesme|sözleşme|kosullar|koşullar|hizmet-sartlari|hizmet-şartları|user-agreement/i],
]

export function detectLegalPage(url: string, title: string): LegalKind | null {
  let path = ''
  try {
    const u = new URL(url)
    if (!/^https?:$/.test(u.protocol)) return null
    path = decodeURIComponent(u.pathname + u.search)
  } catch {
    return null
  }
  const hay = `${path} ${title}`
  for (const [kind, re] of PATTERNS) if (re.test(hay)) return kind
  return null
}
