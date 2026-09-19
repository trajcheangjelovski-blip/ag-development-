import { createAdminClient } from '@/lib/supabase/server'
import { CATALOG } from '@/lib/catalog'
import { getCardDefaults } from '@/lib/planDefaults'

// Server-side plan access: reads the `plans` table (admin-editable), falling
// back to the static catalog when the table is missing or empty.

export type PlanDetail = { label: string; value: string }

export type Plan = {
  id: string
  region: string
  currency: string
  name: string
  description: string
  category: string
  price: number
  billing_interval: 'month' | null
  sale_price: number | null
  sale_active: boolean
  is_active: boolean
  sort: number
  // Rich card content (null = keep the built-in site copy)
  badge: string | null
  features: string[] | null
  details: PlanDetail[] | null
  good_for: string | null
  delivery: string | null
  // For Extras: what one unit grants
  grant_type: 'hours' | 'tickets' | 'items' | null
  grant_qty: number
}

export function effectivePrice(p: Plan): number {
  return p.sale_active && p.sale_price != null && p.sale_price > 0 ? p.sale_price : p.price
}

function staticPlans(region = 'us'): Plan[] {
  return CATALOG.map((c, i) => ({
    id: c.id,
    region,
    currency: region === 'mk' ? 'MKD' : 'USD',
    name: c.name,
    description: c.description,
    category: c.category,
    price: c.price,
    billing_interval: c.interval,
    sale_price: null,
    sale_active: false,
    is_active: true,
    sort: i,
    badge: null,
    features: null,
    details: null,
    good_for: null,
    delivery: null,
    grant_type: null,
    grant_qty: 1,
  }))
}

// MK plans live in a separate `plans_mk` table so the original `plans` table
// (and the deployed English site that reads it) is never affected.
export function plansTable(region: string): 'plans' | 'plans_mk' {
  return region === 'mk' ? 'plans_mk' : 'plans'
}

export async function getPlans(region = 'us'): Promise<{ plans: Plan[]; fromDb: boolean }> {
  const currency = region === 'mk' ? 'MKD' : 'USD'
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from(plansTable(region)).select('*').order('sort')
    if (error || !data?.length) return { plans: staticPlans(region), fromDb: false }
    return {
      plans: data.map((d: any) => ({
        id: d.id,
        region,
        currency,
        name: d.name,
        description: d.description || '',
        category: d.category,
        price: d.price,
        billing_interval: d.billing_interval,
        sale_price: d.sale_price,
        sale_active: !!d.sale_active,
        is_active: !!d.is_active,
        sort: d.sort ?? 0,
        badge: d.badge ?? null,
        features: Array.isArray(d.features) && d.features.length ? d.features : null,
        details: Array.isArray(d.details) && d.details.length ? d.details : null,
        good_for: d.good_for ?? null,
        delivery: d.delivery ?? null,
        grant_type: d.grant_type ?? null,
        grant_qty: Number(d.grant_qty) || 1,
      })),
      fromDb: true,
    }
  } catch {
    return { plans: staticPlans(), fromDb: false }
  }
}

export async function getPlan(id: string, region = 'us'): Promise<Plan | undefined> {
  const { plans } = await getPlans(region)
  return plans.find(p => p.id === id)
}

// Public, display-ready plans: active plans with rich card content filled in
// from the built-in defaults and the sale-aware effective price precomputed.
// Same shape the /api/plans GET returns and the client `usePlans` hook expects,
// so a server page can pass this as the hook's initial data (no price flash).
export type PublicPlan = Plan & { effective_price: number }

export async function getPublicPlans(region = 'us'): Promise<PublicPlan[]> {
  const { plans } = await getPlans(region)
  return plans
    .filter(p => p.is_active)
    .map(p => {
      const d = getCardDefaults(p.id)
      return {
        ...p,
        badge: p.badge ?? d?.badge ?? null,
        features: p.features ?? d?.features ?? null,
        details: p.details ?? d?.details ?? null,
        good_for: p.good_for ?? d?.good_for ?? null,
        delivery: p.delivery ?? d?.delivery ?? null,
        description: p.description || d?.description || '',
        effective_price: effectivePrice(p),
      }
    })
}
