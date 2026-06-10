import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripeConfig, verifyStripeSignature } from '@/lib/stripe'
import { notifyAdmin, getClientProfileId, createNotification } from '@/lib/notifications'
import { sendNewLeadNotification } from '@/lib/email'
import { getAdminEmail } from '@/lib/settings'

// Stripe webhook: records completed payments.
// Configure in Stripe Dashboard → Webhooks → endpoint /api/stripe/webhook
// listening for checkout.session.completed.
export async function POST(request: NextRequest) {
  const payload = await request.text()
  const cfg = await getStripeConfig()

  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), cfg.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(payload)
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const supabase = await createAdminClient()
  const amount = (session.amount_total ?? 0) / 100
  const customerEmail = session.customer_details?.email || session.customer_email || ''
  const customerName = session.customer_details?.name || customerEmail || 'Stripe customer'

  // ── Invoice payment from the client portal ──
  if (session.metadata?.invoice_id) {
    const { data: invoice } = await supabase
      .from('invoices')
      .update({ status: 'Paid', paid_at: new Date().toISOString() })
      .eq('id', session.metadata.invoice_id)
      .select('*, client:clients(business_name)')
      .single()

    if (invoice) {
      await notifyAdmin({
        title: `💰 Invoice paid: $${amount} — ${(invoice.client as any)?.business_name || 'client'}`,
        body: `${invoice.billing_month} · ${invoice.description}`,
        link: '/admin/invoices',
        type: 'success',
      })
      const profileId = await getClientProfileId(invoice.client_id)
      if (profileId) {
        await createNotification({
          userId: profileId,
          title: 'Payment received ✓',
          body: `Your payment of $${amount} for ${invoice.billing_month} was successful. Thank you!`,
          link: '/portal/invoices',
          type: 'success',
        })
      }
    }
    return NextResponse.json({ received: true })
  }

  // ── Public cart purchase: record as a Won order in the CRM ──
  const summary = session.metadata?.cart_summary || 'Stripe Checkout purchase'
  const { data: lead } = await supabase
    .from('leads')
    .insert({
      business_name: customerName,
      full_name: customerName,
      email: customerEmail || 'unknown@stripe.checkout',
      help_type: `Paid Order: ${summary}`.slice(0, 500),
      budget: `$${amount} paid via Stripe`,
      message: `— Stripe Payment —\nAmount: $${amount}\nMode: ${session.mode}\nSession: ${session.id}\nItems: ${summary}`,
      status: 'Won',
    })
    .select()
    .single()

  await notifyAdmin({
    title: `💰 Payment received: $${amount} from ${customerName}`,
    body: summary,
    link: lead ? `/admin/leads/${lead.id}` : '/admin/leads',
    type: 'success',
  })

  await sendNewLeadNotification({
    adminEmail: await getAdminEmail(),
    businessName: customerName,
    fullName: customerName,
    leadEmail: customerEmail || '—',
    budget: `$${amount} PAID via Stripe`,
    helpType: summary,
  })

  return NextResponse.json({ received: true })
}
