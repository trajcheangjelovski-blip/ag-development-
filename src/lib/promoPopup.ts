import { createAdminClient } from '@/lib/supabase/server'

// Admin-editable promotional popup, stored per region as a JSON blob in the
// `app_settings` table (keys `promo_popup_us` / `promo_popup_mk`). The public
// homepage reads the merged config server-side; the admin panel edits it.
// Anything the admin hasn't set falls back to the built-in defaults below, so
// the popup keeps working before it's ever configured.

export type PromoOffer = {
  label: string
  oldPrice: string
  newPrice: string
  unit?: string
  discount: string
}

export type PromoConfig = {
  enabled: boolean
  badge: string
  titleLead: string
  titleHighlight: string
  titleTrail: string
  subtitle: string
  offers: PromoOffer[]
  features: string[]
  ctaLabel: string
  ctaHref: string
  // Derived at read time (not edited directly). Changes on every save so the
  // popup re-shows to visitors who had dismissed the previous version.
  storageKey: string
}

export type Region = 'us' | 'mk'

// Built-in defaults — the content the popup shipped with. `enabled: true` keeps
// the current behavior until an admin turns it off.
export const PROMO_DEFAULTS: Record<Region, Omit<PromoConfig, 'storageKey'>> = {
  us: {
    enabled: true,
    badge: 'Limited offer',
    titleLead: 'Get ',
    titleHighlight: '50% off',
    titleTrail: ' your new website',
    subtitle: 'Modern, mobile-friendly websites for your business — every build and care plan is on sale right now.',
    offers: [
      { label: 'Website build (Business Site)', oldPrice: '$250', newPrice: '$125', unit: 'one-time', discount: '-50%' },
      { label: 'Monthly care (Basic Care)', oldPrice: '$29', newPrice: '$14', unit: '/mo', discount: '-52%' },
    ],
    features: ['Modern design', 'Mobile-friendly', 'Better visibility', 'Reliable support'],
    ctaLabel: 'Claim 50% off →',
    ctaHref: '/pricing',
  },
  mk: {
    enabled: true,
    badge: 'Ограничена понуда',
    titleLead: 'Специјална понуда за ',
    titleHighlight: 'изработка на веб страна',
    titleTrail: '',
    subtitle: 'Професионална, модерна и мобилно прилагодена веб страна за вашиот бизнис.',
    offers: [
      { label: 'Изработка на веб страна', oldPrice: '10.000 ден', newPrice: '6.000 ден', unit: '', discount: '-40%' },
      { label: 'Месечно одржување', oldPrice: '1.500 ден / месечно', newPrice: '800 ден', unit: '/ месечно', discount: '-47%' },
    ],
    features: ['Модерен дизајн', 'Мобилно прилагодена', 'Подобра видливост', 'Сигурна поддршка'],
    ctaLabel: 'Контактирајте нè денес →',
    ctaHref: '/contact',
  },
}

export function settingsKey(region: Region): string {
  return region === 'mk' ? 'promo_popup_mk' : 'promo_popup_us'
}

// Merge a saved (possibly partial) blob over the defaults for a region, and
// compute a storage key that changes whenever the admin last saved.
function mergeConfig(region: Region, saved: Record<string, unknown> | null): PromoConfig {
  const d = PROMO_DEFAULTS[region]
  const s = saved ?? {}
  const offers = Array.isArray(s.offers) && s.offers.length ? (s.offers as PromoOffer[]) : d.offers
  const features = Array.isArray(s.features) && s.features.length ? (s.features as string[]) : d.features
  const updatedAt = typeof s.updatedAt === 'number' ? s.updatedAt : null
  return {
    enabled: typeof s.enabled === 'boolean' ? s.enabled : d.enabled,
    badge: typeof s.badge === 'string' ? s.badge : d.badge,
    titleLead: typeof s.titleLead === 'string' ? s.titleLead : d.titleLead,
    titleHighlight: typeof s.titleHighlight === 'string' ? s.titleHighlight : d.titleHighlight,
    titleTrail: typeof s.titleTrail === 'string' ? s.titleTrail : d.titleTrail,
    subtitle: typeof s.subtitle === 'string' ? s.subtitle : d.subtitle,
    offers: offers.slice(0, 3),
    features: features.slice(0, 4),
    ctaLabel: typeof s.ctaLabel === 'string' ? s.ctaLabel : d.ctaLabel,
    ctaHref: typeof s.ctaHref === 'string' ? s.ctaHref : d.ctaHref,
    storageKey: `ag_promo_${region}_${updatedAt ?? 'default'}`,
  }
}

// Server-side: the effective popup config for a region, defaults filled in.
export async function getPromoPopup(region: Region): Promise<PromoConfig> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', settingsKey(region))
      .maybeSingle()
    const saved = data?.value ? (JSON.parse(data.value) as Record<string, unknown>) : null
    return mergeConfig(region, saved)
  } catch {
    return mergeConfig(region, null)
  }
}
