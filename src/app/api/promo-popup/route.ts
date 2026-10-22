import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPromoPopup, settingsKey, type Region, type PromoOffer } from '@/lib/promoPopup'

// Always fresh so admin edits appear on the site immediately.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function regionOf(request: NextRequest): Region {
  return new URL(request.url).searchParams.get('region') === 'mk' ? 'mk' : 'us'
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// GET: public — the effective (defaults-merged) popup config for a region.
export async function GET(request: NextRequest) {
  const config = await getPromoPopup(regionOf(request))
  return NextResponse.json(config)
}

function str(v: unknown, max = 400): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}

function cleanOffers(input: unknown): PromoOffer[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, 3)
    .map(o => ({
      label: str((o as any)?.label, 120),
      oldPrice: str((o as any)?.oldPrice, 40),
      newPrice: str((o as any)?.newPrice, 40),
      unit: str((o as any)?.unit, 40),
      discount: str((o as any)?.discount, 20),
    }))
    .filter(o => o.label || o.newPrice)
}

// PATCH: admin — save the popup config for a region.
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const region = regionOf(request)
  const body = await request.json()

  const payload = {
    enabled: !!body.enabled,
    badge: str(body.badge, 60),
    titleLead: str(body.titleLead, 120),
    titleHighlight: str(body.titleHighlight, 120),
    titleTrail: str(body.titleTrail, 120),
    subtitle: str(body.subtitle, 400),
    offers: cleanOffers(body.offers),
    features: Array.isArray(body.features)
      ? body.features.map((f: unknown) => str(f, 80)).filter(Boolean).slice(0, 4)
      : [],
    ctaLabel: str(body.ctaLabel, 80),
    ctaHref: str(body.ctaHref, 200) || '/contact',
    // Bumps the public storage key so the popup re-shows after an edit.
    updatedAt: Date.now(),
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: settingsKey(region), value: JSON.stringify(payload) }, { onConflict: 'key' })

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Settings table missing. Run the app_settings SQL from supabase/schema.sql first.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(await getPromoPopup(region))
}
