import { BUILD_PACKAGES, CARE_PLANS } from '@/app/order/_data'

// Built-in card content from the website, used to pre-fill the admin plan
// editor so the admin sees exactly what's on the site and can edit it.

export type CardDefaults = {
  badge: string | null
  features: string[] | null
  details: { label: string; value: string }[] | null
  good_for: string | null
  delivery: string | null
  description: string | null
}

export function getCardDefaults(id: string): CardDefaults | undefined {
  const build = BUILD_PACKAGES.find(p => p.id === id)
  if (build) {
    return {
      badge: build.badge || null,
      features: build.features || null,
      details: build.details || null,
      good_for: build.goodFor || null,
      delivery: build.details?.find(d => d.label.toLowerCase().includes('delivery'))?.value || null,
      description: build.description || null,
    }
  }
  const care = CARE_PLANS.find(p => p.id === id)
  if (care && care.id !== 'none') {
    return {
      badge: care.badge || null,
      features: care.features || null,
      details: care.details || null,
      good_for: care.goodFor || null,
      delivery: null,
      description: care.description || null,
    }
  }
  return undefined
}
