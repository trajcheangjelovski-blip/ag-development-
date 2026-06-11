import { createAdminClient } from '@/lib/supabase/server'
import { CATALOG } from '@/lib/catalog'

// Server-side plan access: reads the `plans` table (admin-editable), falling
// back to the static catalog when the table is missing or empty.

export type PlanDetail = { label: string; value: string }

export type Plan = {
  id: string
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

function staticPlans(): Plan[] {
  return CATALOG.map((c, i) => ({
    id: c.id,
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

export async function getPlans(): Promise<{ plans: Plan[]; fromDb: boolean }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('plans').select('*').order('sort')
    if (error || !data?.length) return { plans: staticPlans(), fromDb: false }
    return {
      plans: data.map((d: any) => ({
        id: d.id,
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

export async function getPlan(id: string): Promise<Plan | undefined> {
  const { plans } = await getPlans()
  return plans.find(p => p.id === id)
}
