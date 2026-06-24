// Meta (Facebook) Pixel helpers.
// The base pixel + fbq('init') / fbq('track','PageView') is loaded in src/app/layout.tsx.
// Use these helpers to fire standard conversion events from client components.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

type FbEventParams = {
  value?: number
  currency?: string
  content_ids?: string[]
  content_type?: string
  content_name?: string
  num_items?: number
  [key: string]: unknown
}

/** Fire a Meta standard event (no-op if the pixel hasn't loaded yet). */
export function fbTrack(event: string, params?: FbEventParams) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', event, params)
}

// ── Pending purchase handoff ──────────────────────────────────────────────────
// The success page can't recompute the order total (the cart is cleared and it
// doesn't fetch plans), so checkout() stashes the value here right before the
// Stripe redirect, and the success page reads + clears it to fire Purchase.

const PENDING_PURCHASE_KEY = 'ag-pending-purchase'

export type PendingPurchase = {
  value: number
  currency: string
  content_ids: string[]
  num_items: number
}

export function setPendingPurchase(p: PendingPurchase) {
  try { localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(p)) } catch {}
}

export function takePendingPurchase(): PendingPurchase | null {
  try {
    const raw = localStorage.getItem(PENDING_PURCHASE_KEY)
    if (!raw) return null
    localStorage.removeItem(PENDING_PURCHASE_KEY)
    return JSON.parse(raw) as PendingPurchase
  } catch {
    return null
  }
}
