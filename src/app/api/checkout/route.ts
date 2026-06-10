import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripeRequest } from '@/lib/stripe'
import { getCatalogItem } from '@/lib/catalog'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Creates a Stripe Checkout session.
// Two modes:
//  - Cart checkout (public): body { items: string[] } of catalog IDs.
//  - Invoice payment (logged-in client): body { invoice_id: string }.
export async function POST(request: NextRequest) {
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
    const items = ids.map(getCatalogItem).filter(Boolean) as NonNullable<ReturnType<typeof getCatalogItem>>[]
    if (!items.length) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const hasRecurring = items.some(i => i.interval === 'month')
    const summary = items.map(i => `${i.name} ($${i.price}${i.interval ? '/mo' : ''})`).join(', ')

    const session = await stripeRequest('checkout/sessions', {
      mode: hasRecurring ? 'subscription' : 'payment',
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cart`,
      line_items: items.map(i => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: i.price * 100,
          product_data: { name: i.name, description: i.description },
          ...(i.interval ? { recurring: { interval: i.interval } } : {}),
        },
      })),
      metadata: { cart_summary: summary.slice(0, 480) },
      ...(hasRecurring ? { subscription_data: { metadata: { cart_summary: summary.slice(0, 480) } } } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
