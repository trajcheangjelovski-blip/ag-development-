import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createNotification, getClientProfileId } from '@/lib/notifications'
import { sendNewInvoiceToClient } from '@/lib/email'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('clients')
    .select('*, package:support_packages(*)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // Assigning a (new) plan starts a fresh 1-month plan period
  const { data: existing } = await supabase.from('clients').select('package_id').eq('id', id).single()
  const planChanged = !!body.package_id && body.package_id !== existing?.package_id
  if (planChanged) {
    const start = new Date()
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    body.plan_started_at = start.toISOString()
    body.plan_expires_at = end.toISOString()
  }

  const { data, error } = await supabase.from('clients').update(body).eq('id', id).select('*, package:support_packages(*)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create the extras tracking ledger from the package's structured extras
  if (planChanged) {
    const admin = await createAdminClient()
    const pkg = (data.package as any)
    const pkgExtras = pkg?.extras
    if (Array.isArray(pkgExtras) && pkgExtras.length) {
      const unitFor = (t: string) => (t === 'hours' ? 'hours' : t === 'tickets' ? 'tickets' : 'items')
      await admin.from('client_extras').insert(
        pkgExtras.map((x: any) => ({
          client_id: id,
          name: x.name,
          qty_total: Math.max(1, Math.round((Number(x.qty) || 1) * (Number(x.grant_qty) || 1))),
          qty_used: 0,
          unit: unitFor(x.grant_type),
        })),
      ).then(({ error: e }) => { if (e) console.error('Extras ledger seed error:', e) })
    }

    // Auto-create invoices for the newly assigned package:
    //   • one-time setup fee (charged once)
    //   • first month's recurring price (the monthly job bills it thereafter)
    if (!body.skip_invoice) {
      const billing_month = new Date().toISOString().slice(0, 7) // YYYY-MM
      const monthly = Number(pkg?.price) || 0
      const setup = Number(pkg?.setup_fee) || 0
      const planName = pkg?.name || 'Plan'
      const toCreate: { amount: number; description: string }[] = []
      if (setup > 0) toCreate.push({ amount: setup, description: `${planName} — One-time setup` })
      if (monthly > 0) toCreate.push({ amount: monthly, description: `${planName} — Monthly` })

      if (toCreate.length) {
        await admin.from('invoices').insert(
          toCreate.map(t => ({ client_id: id, amount: t.amount, billing_month, description: t.description, status: 'Pending' })),
        )
        const total = setup + monthly
        const profileId = await getClientProfileId(id)
        if (profileId) {
          createNotification({
            userId: profileId,
            title: `New invoice${toCreate.length > 1 ? 's' : ''}: $${total} (${billing_month})`,
            body: `${planName}${setup > 0 && monthly > 0 ? ` — $${setup} setup + $${monthly}/mo` : ''}. Pay online from your portal.`,
            link: '/portal/invoices',
            type: 'info',
          }).catch(() => {})
        }
        const c = data as any
        if (c?.email) {
          sendNewInvoiceToClient({
            clientEmail: c.email,
            clientName: c.contact_name || c.business_name || 'there',
            amount: total,
            billingMonth: billing_month,
            description: toCreate.map(t => t.description).join(' + '),
            dueDate: null,
          }).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json(data)
}
