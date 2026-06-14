import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripeRequest } from '@/lib/stripe'
import { getPlans, effectivePrice, type Plan } from '@/lib/plans'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Creates a Stripe Checkout session.
// Two modes:
//  - Cart checkout (public): body { items: string[] } of catalog IDs.
//  - Invoice payment (logged-in client): body { invoice_id: string }.
export async function POST(request: NextRequest) {
  if (!rateLimit(`checkout:${clientIp(request)}`, 12, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a moment and try again.' }, { status: 429 })
  }
  const body = await request.json()

  try {
    // ── Invoice payment (client portal) ──
    if (body.invoice_id) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { data: profile } = await supabase.from('profiles').select('client_id, role').eq('id', user.id).single()
      const { data: invoice } = await supabase.from('invoices').select('*').eq('id', body.invoice_id).single()

      if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      if (profile?.role !== 'admin' && invoice.client_id !== profile?.client_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (!['Pending', 'Overdue'].includes(invoice.status)) {
        return NextResponse.json({ error: `Invoice is ${invoice.status.toLowerCase()} — nothing to pay` }, { status: 400 })
      }

      const session = await stripeRequest('checkout/sessions', {
        mode: 'payment',
        success_url: `${APP_URL}/portal/invoices?paid=1`,
        cancel_url: `${APP_URL}/portal/invoices`,
        customer_email: user.email,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: invoice.amount * 100,
            product_data: { name: `Invoice ${invoice.billing_month} — ${invoice.description}` },
          },
        }],
        metadata: { invoice_id: invoice.id },
        payment_intent_data: { metadata: { invoice_id: invoice.id } },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Cart checkout (public site) ──
    const ids: string[] = Array.isArray(body.items) ? body.items : []
    const { plans } = await getPlans()
    const items = ids
      .map(id => plans.find(p => p.id === id && p.is_active))
      .filter(Boolean) as Plan[]
    if (!items.length) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const hasRecurring = items.some(i => i.billing_interval === 'month')
    const summary = items
      .map(i => `${i.name} ($${effectivePrice(i)}${i.billing_interval ? '/mo' : ''})`)
      .join(', ')

    // Optional coupon: validate against our DB, then mirror it as a one-off
    // Stripe coupon so the discount shows on Stripe's checkout page.
    let discounts: any = undefined
    let couponNote = ''
    if (body.coupon_code) {
      const admin = await createAdminClient()
      const { data: coupon } = await admin
        .from('coupons')
        .select('*')
        .eq('code', String(body.coupon_code).trim().toUpperCase())
        .maybeSingle()

      const valid = coupon
        && coupon.is_active
        && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date())
        && (!coupon.max_redemptions || coupon.redemptions < coupon.max_redemptions)

      if (!valid) {
        return NextResponse.json({ error: 'Coupon is invalid or expired' }, { status: 400 })
      }

      const stripeCoupon = await stripeRequest('coupons', {
        duration: 'once',
        ...(coupon.percent_off
          ? { percent_off: coupon.percent_off }
          : { amount_off: coupon.amount_off * 100, currency: 'usd' }),
        name: coupon.code,
      })
      discounts = [{ coupon: stripeCoupon.id }]
      couponNote = ` — coupon ${coupon.code}`
      await admin.from('coupons').update({ redemptions: (coupon.redemptions || 0) + 1 }).eq('id', coupon.id)
    }

    const session = await stripeRequest('checkout/sessions', {
      mode: hasRecurring ? 'subscription' : 'payment',
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cart`,
      line_items: items.map(i => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: effectivePrice(i) * 100,
          product_data: { name: i.name, ...(i.description ? { description: i.description } : {}) },
          ...(i.billing_interval ? { recurring: { interval: i.billing_interval } } : {}),
        },
      })),
      ...(discounts ? { discounts } : {}),
      metadata: { cart_summary: (summary + couponNote).slice(0, 480) },
      ...(hasRecurring ? { subscription_data: { metadata: { cart_summary: (summary + couponNote).slice(0, 480) } } } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
