import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createNotification, getClientProfileId } from '@/lib/notifications'
import { sendNewInvoiceToClient } from '@/lib/email'

// Recurring monthly billing: once a month, generate a Pending invoice for each
// active client's monthly plan price. Idempotent — it skips any client that
// already has this month's "— Monthly" invoice (so assigning a plan mid-month,
// which already creates month-1, won't double-bill).
//
// Schedule it on the 1st of each month, sending CRON_SECRET as a Bearer token.

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(request.url).searchParams.get('secret')
  return provided === secret
}

async function run() {
  const admin = await createAdminClient()
  const billing_month = new Date().toISOString().slice(0, 7) // YYYY-MM

  const { data: clients, error } = await admin
    .from('clients')
    .select('id, email, contact_name, business_name, is_active, package:support_packages(name, price)')
    .eq('is_active', true)
  if (error) return { error: error.message }

  let created = 0
  for (const c of clients || []) {
    const pkg = (c as any).package
    const price = Number(pkg?.price) || 0
    if (price <= 0) continue
    const description = `${pkg?.name || 'Plan'} — Monthly`

    // Already billed this month?
    const { count } = await admin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', c.id)
      .eq('billing_month', billing_month)
      .eq('description', description)
    if ((count ?? 0) > 0) continue

    await admin.from('invoices').insert({
      client_id: c.id, amount: price, billing_month, description, status: 'Pending',
    })
    created++

    const profileId = await getClientProfileId(c.id)
    if (profileId) {
      createNotification({
        userId: profileId,
        title: `New invoice: $${price} (${billing_month})`,
        body: `${description}. Pay online from your portal.`,
        link: '/portal/invoices',
        type: 'info',
      }).catch(() => {})
    }
    if ((c as any).email) {
      sendNewInvoiceToClient({
        clientEmail: (c as any).email,
        clientName: (c as any).contact_name || (c as any).business_name || 'there',
        amount: price,
        billingMonth: billing_month,
        description,
        dueDate: null,
      }).catch(() => {})
    }
  }
  return { ok: true, month: billing_month, clientsChecked: clients?.length || 0, invoicesCreated: created }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
