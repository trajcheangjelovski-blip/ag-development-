'use client'
import { useState, useEffect, useMemo } from 'react'

// Client hook: fetch admin-managed plans and merge their values over the
// static card data used by order/pricing pages. Any field the admin filled in
// overrides the built-in copy; everything else keeps the site default.

export type ApiPlan = {
  id: string
  name: string
  description: string
  category: string
  price: number
  billing_interval: 'month' | null
  sale_price: number | null
  sale_active: boolean
  effective_price: number
  badge: string | null
  features: string[] | null
  details: { label: string; value: string }[] | null
  good_for: string | null
  delivery: string | null
}

export function usePlans() {
  const [apiPlans, setApiPlans] = useState<ApiPlan[]>([])
  useEffect(() => {
    fetch('/api/plans', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setApiPlans(d) })
      .catch(() => {})
  }, [])
  return apiPlans
}

// Merge an API plan over a static card object (shape-preserving).
export function mergeCard<T extends { id: string }>(staticCard: T, apiPlans: ApiPlan[]): T {
  const p = apiPlans.find(x => x.id === staticCard.id)
  if (!p) return staticCard
  const s: any = staticCard
  const merged: any = { ...s }

  merged.name = p.name || s.name
  if (p.description) merged.description = p.description
  if (p.badge) merged.badge = p.badge
  if (p.features) merged.features = p.features
  if (p.details) merged.details = p.details
  if (p.good_for) merged.goodFor = p.good_for
  if (p.delivery) merged.delivery = p.delivery

  // Pricing: effective price is what's charged; show regular as strikethrough
  if ('salePrice' in s) {
    merged.salePrice = p.effective_price
    merged.originalPrice = p.price
  } else {
    merged.price = p.effective_price
    if (p.sale_active && p.effective_price < p.price) merged.originalPrice = p.price
  }
  return merged as T
}

export function useMergedCards<T extends { id: string }>(staticCards: readonly T[]): T[] {
  const apiPlans = usePlans()
  return useMemo(
    () => staticCards.map(c => mergeCard(c, apiPlans)),
    [staticCards, apiPlans],
  )
}

// Price-only overlay. Returns a map of catalog id -> live effective (sale-aware)
// price. Use on pages that keep their own card copy but whose card ids differ
// from the catalog ids (e.g. it-support 'basic' -> catalog 'it-basic'). This
// changes ONLY the displayed price, leaving every other card field untouched.
export function usePlanPriceMap(): Record<string, number> {
  const apiPlans = usePlans()
  return useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of apiPlans) m[p.id] = p.effective_price
    return m
  }, [apiPlans])
}
