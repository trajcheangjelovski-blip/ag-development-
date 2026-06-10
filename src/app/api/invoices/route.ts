import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification, getClientProfileId } from '@/lib/notifications'
import { sendNewInvoiceToClient } from '@/lib/email'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const clientId = new URL(request.url).searchParams.get('client_id')

  let query = supabase
    .from('invoices')
    .select('*, client:clients(business_name)')
    .order('created_at', { ascending: false })

  if (profile?.role !== 'admin') {
    query = query.eq('client_id', profile?.client_id)
  } else if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('invoices')
    .insert(body)
    .select('*, client:clients(email, contact_name, business_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the client: portal bell + email
  const clientInfo = data.client as any
  const profileId = await getClientProfileId(data.client_id)
  if (profileId) {
    await createNotification({
      userId: profileId,
      title: `New invoice: $${data.amount} (${data.billing_month})`,
      body: `${data.description}${data.due_date ? ` — due ${data.due_date}` : ''}. Pay online from your portal.`,
      link: '/portal/invoices',
      type: 'info',
    })
  }
  if (clientInfo?.email) {
    await sendNewInvoiceToClient({
      clientEmail: clientInfo.email,
      clientName: clientInfo.contact_name || clientInfo.business_name || 'there',
      amount: data.amount,
      billingMonth: data.billing_month,
      description: data.description,
      dueDate: data.due_date,
    })
  }

  return NextResponse.json(data, { status: 201 })
}
