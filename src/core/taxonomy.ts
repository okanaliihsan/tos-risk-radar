/**
 * Risk taxonomy.
 *
 * The first nine categories follow the CLAUDETTE unfair-clause taxonomy
 * (Lippi et al., 2019) so that they can be evaluated against expert labels.
 * The remaining categories cover privacy and subscription risks that the
 * assignment asks for but that have no gold labels in the eval corpus; the
 * eval reports them separately instead of counting them as false alarms.
 */

export const SEVERITIES = ['low', 'medium', 'high'] as const
export type Severity = (typeof SEVERITIES)[number]

export const CATEGORY_IDS = [
  // CLAUDETTE-aligned
  'arbitration',
  'unilateral_change',
  'content_removal',
  'jurisdiction',
  'choice_of_law',
  'liability_limitation',
  'unilateral_termination',
  'contract_by_using',
  'privacy_by_using',
  // privacy / subscription extensions
  'data_sharing',
  'data_retention',
  'tracking_profiling',
  'auto_renewal',
  'cancellation_refund',
  'price_change',
  'content_license',
] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface CategoryInfo {
  id: CategoryId
  /** Turkish label shown in the UI */
  label: string
  /** One-line definition given to the LLM (English, precise) */
  definition: string
  /** CLAUDETTE column code, or null when the category has no gold labels */
  claudette: 'A' | 'CH' | 'CR' | 'J' | 'LAW' | 'LTD' | 'TER' | 'USE' | 'PINC' | null
  /** Default severity used when the rule-based detector flags it */
  defaultSeverity: Severity
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  arbitration: {
    id: 'arbitration',
    label: 'Zorunlu tahkim / dava hakkından feragat',
    definition:
      'Disputes must go to arbitration, or the user waives class actions or jury trials.',
    claudette: 'A',
    defaultSeverity: 'high',
  },
  unilateral_change: {
    id: 'unilateral_change',
    label: 'Şartların tek taraflı değiştirilmesi',
    definition:
      'The provider may change the terms or the service at its discretion, possibly without notice.',
    claudette: 'CH',
    defaultSeverity: 'medium',
  },
  content_removal: {
    id: 'content_removal',
    label: 'İçeriğin tek taraflı kaldırılması',
    definition: 'The provider may remove or block user content at its discretion.',
    claudette: 'CR',
    defaultSeverity: 'medium',
  },
  jurisdiction: {
    id: 'jurisdiction',
    label: 'Uzak / tek taraflı yetkili mahkeme',
    definition:
      'Disputes must be brought in courts of a specific place, usually far from the consumer.',
    claudette: 'J',
    defaultSeverity: 'medium',
  },
  choice_of_law: {
    id: 'choice_of_law',
    label: 'Yabancı hukukun uygulanması',
    definition: 'The contract is governed by the law of a specific (often foreign) country or state.',
    claudette: 'LAW',
    defaultSeverity: 'low',
  },
  liability_limitation: {
    id: 'liability_limitation',
    label: 'Sorumluluğun sınırlandırılması',
    definition:
      'The provider excludes or caps its liability for damages, losses or service failures.',
    claudette: 'LTD',
    defaultSeverity: 'high',
  },
  unilateral_termination: {
    id: 'unilateral_termination',
    label: 'Hesabın tek taraflı kapatılması',
    definition:
      'The provider may suspend or terminate the account or service at its discretion or without cause.',
    claudette: 'TER',
    defaultSeverity: 'medium',
  },
  contract_by_using: {
    id: 'contract_by_using',
    label: 'Kullanarak kabul sayılma',
    definition: 'Merely using or accessing the service counts as accepting the terms.',
    claudette: 'USE',
    defaultSeverity: 'low',
  },
  privacy_by_using: {
    id: 'privacy_by_using',
    label: 'Kullanarak gizlilik politikasını kabul',
    definition:
      'Using the service counts as consent to the privacy policy or to data processing.',
    claudette: 'PINC',
    defaultSeverity: 'low',
  },
  data_sharing: {
    id: 'data_sharing',
    label: 'Verilerin üçüncü taraflarla paylaşımı / satışı',
    definition:
      'Personal data is shared with, sold to, or made available to third parties or affiliates.',
    claudette: null,
    defaultSeverity: 'high',
  },
  data_retention: {
    id: 'data_retention',
    label: 'Verilerin uzun / belirsiz süre saklanması',
    definition:
      'Personal data is kept indefinitely, for an unspecified time, or after account deletion.',
    claudette: null,
    defaultSeverity: 'medium',
  },
  tracking_profiling: {
    id: 'tracking_profiling',
    label: 'Takip, profilleme ve hedefli reklam',
    definition:
      'User behaviour is tracked across sites/devices or profiled, e.g. for targeted advertising.',
    claudette: null,
    defaultSeverity: 'medium',
  },
  auto_renewal: {
    id: 'auto_renewal',
    label: 'Otomatik yenileme',
    definition: 'A subscription renews and charges automatically unless the user cancels.',
    claudette: null,
    defaultSeverity: 'medium',
  },
  cancellation_refund: {
    id: 'cancellation_refund',
    label: 'İptal / iade kısıtlaması',
    definition: 'Payments are non-refundable, or cancelling is restricted, delayed or penalised.',
    claudette: null,
    defaultSeverity: 'high',
  },
  price_change: {
    id: 'price_change',
    label: 'Tek taraflı fiyat değişikliği',
    definition: 'The provider may change prices or fees, possibly for existing subscribers.',
    claudette: null,
    defaultSeverity: 'medium',
  },
  content_license: {
    id: 'content_license',
    label: 'Kullanıcı içeriğine geniş lisans',
    definition:
      'The user grants a broad (worldwide, royalty-free, sublicensable or perpetual) licence to their content.',
    claudette: null,
    defaultSeverity: 'medium',
  },
}

export const CLAUDETTE_CODES = ['A', 'CH', 'CR', 'J', 'LAW', 'LTD', 'TER', 'USE', 'PINC'] as const
export type ClaudetteCode = (typeof CLAUDETTE_CODES)[number]

export function categoryForClaudette(code: ClaudetteCode): CategoryId {
  const found = CATEGORY_IDS.find((id) => CATEGORIES[id].claudette === code)
  if (!found) throw new Error(`No category for CLAUDETTE code ${code}`)
  return found
}
