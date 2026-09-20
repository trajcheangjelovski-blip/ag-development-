import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Localized user-facing validation messages (does not affect coupon logic).
const STR = {
  en: {
    enterCode: 'Enter a coupon code',
    invalid: 'Invalid coupon code',
    inactive: 'This coupon is no longer active',
    expired: 'This coupon has expired',
    limit: 'This coupon has reached its usage limit',
  },
  mk: {
    enterCode: 'Внесете код за попуст',
    invalid: 'Неважечки код за попуст',
    inactive: 'Овој код повеќе не е активен',
    expired: 'Овој код е истечен',
    limit: 'Овој код го достигна лимитот на употреба',
  },
} as const

// Public: validate a coupon code for the cart.
export async function POST(request: NextRequest) {
  const { code, locale } = await request.json()
  const str = STR[locale === 'mk' ? 'mk' : 'en']
  const normalized = (code || '').trim().toUpperCase()
  if (!normalized) return NextResponse.json({ error: str.enterCode }, { status: 400 })

  const admin = await createAdminClient()
  const { data: coupon, error } = await admin
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .maybeSingle()

  if (error || !coupon) return NextResponse.json({ error: str.invalid }, { status: 404 })
  if (!coupon.is_active) return NextResponse.json({ error: str.inactive }, { status: 400 })
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: str.expired }, { status: 400 })
  }
  if (coupon.max_redemptions && coupon.redemptions >= coupon.max_redemptions) {
    return NextResponse.json({ error: str.limit }, { status: 400 })
  }

  return NextResponse.json({
    code: coupon.code,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
  })
}
