import crypto from 'crypto'
import { getAppSettings } from '@/lib/settings'

// Lightweight Stripe REST client (no SDK dependency).
// Keys come from admin Settings (app_settings table) with env fallback.

export type StripeConfig = {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const s = await getAppSettings()
  return {
    secretKey: s.stripe_secret_key || process.env.STRIPE_SECRET_KEY || '',
    publishableKey: s.stripe_publishable_key || process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: s.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '',
  }
}

export async function stripeConfigured(): Promise<boolean> {
  const cfg = await getStripeConfig()
  return cfg.secretKey.startsWith('sk_') || cfg.secretKey.startsWith('rk_')
}

// Flatten nested params into Stripe's bracket form notation:
// { line_items: [{ price_data: { currency: 'usd' } }] }
//   -> line_items[0][price_data][currency]=usd
function flatten(obj: any, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue
    const name = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'object') flatten(v, `${name}[${i}]`, out)
        else out[`${name}[${i}]`] = String(v)
      })
    } else if (typeof value === 'object') {
      flatten(value, name, out)
    } else {
      out[name] = String(value)
    }
  }
  return out
}

export async function stripeRequest<T = any>(path: string, params: Record<string, any>): Promise<T> {
  const cfg = await getStripeConfig()
  if (!cfg.secretKey) {
    throw new Error('Stripe is not configured. Add your Stripe API keys in Admin → Settings.')
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(flatten(params)).toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe error (${res.status})`)
  }
  return data as T
}

// Verify a Stripe webhook signature (Stripe-Signature header) without the SDK.
export function verifyStripeSignature(payload: string, sigHeader: string | null, secret: string): boolean {
  if (!sigHeader || !secret) return false
  const parts = Object.fromEntries(
    sigHeader.split(',').map(kv => {
      const i = kv.indexOf('=')
      return [kv.slice(0, i), kv.slice(i + 1)]
    }),
  )
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  // Reject events older than 5 minutes (replay protection)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
