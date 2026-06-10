import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { invalidateSettingsCache, getEmailSettings } from '@/lib/settings'
import { getStripeConfig } from '@/lib/stripe'

const EDITABLE_KEYS = [
  'admin_email', 'email_from', 'resend_api_key',
  'stripe_secret_key', 'stripe_publishable_key', 'stripe_webhook_secret',
] as const

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createAdminClient()
  const { error } = await supabase.from('app_settings').select('key').limit(1)
  const tableMissing = !!error && error.code === '42P01'

  const effective = await getEmailSettings()
  const apiKey = effective.apiKey
  const keyConfigured = !!apiKey && !apiKey.includes('your_api')

  const stripe = await getStripeConfig()
  const stripeConfigured = stripe.secretKey.startsWith('sk_') || stripe.secretKey.startsWith('rk_')

  return NextResponse.json({
    tableMissing,
    admin_email: effective.adminEmail,
    email_from: effective.from,
    resend_api_key_masked: keyConfigured ? `••••••••${apiKey.slice(-4)}` : '',
    email_configured: keyConfigured,
    stripe_configured: stripeConfigured,
    stripe_secret_key_masked: stripe.secretKey ? `••••••••${stripe.secretKey.slice(-4)}` : '',
    stripe_publishable_key: stripe.publishableKey,
    stripe_webhook_secret_masked: stripe.webhookSecret ? `••••••••${stripe.webhookSecret.slice(-4)}` : '',
  })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const updates = EDITABLE_KEYS
    .filter(k => typeof body[k] === 'string' && body[k].trim() !== '')
    .map(k => ({ key: k, value: (body[k] as string).trim() }))

  if (!updates.length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' })
  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Settings table missing. Run the app_settings SQL from supabase/schema.sql in your Supabase SQL editor first.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  invalidateSettingsCache()
  return NextResponse.json({ ok: true })
}
