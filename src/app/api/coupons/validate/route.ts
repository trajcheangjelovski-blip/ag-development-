import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public: validate a coupon code for the cart.
export async function POST(request: NextRequest) {
  const { code } = await request.json()
  const normalized = (code || '').trim().toUpperCase()
  if (!normalized) return NextResponse.json({ error: 'Enter a coupon code' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: coupon, error } = await admin
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .maybeSingle()

  if (error || !coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  if (!coupon.is_active) return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
  }
  if (coupon.max_redemptions && coupon.redemptions >= coupon.max_redemptions) {
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
  }

  return NextResponse.json({
    code: coupon.code,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
  })
}
