import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewTicketAlertToAdmin } from '@/lib/email'
import { createNotification, notifyAdmin } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const clientId = searchParams.get('client_id')

  let query = supabase
    .from('tickets')
    .select('*, client:clients(id, business_name, email, package_id), creator:profiles!created_by(id, full_name, role)')
    .order('created_at', { ascending: false })

  if (profile?.role !== 'admin') {
    query = query.eq('client_id', profile?.client_id)
  } else if (clientId) {
    query = query.eq('client_id', clientId)
  }
  if (status && status !== 'All') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const body = await request.json()
  const { title, category, priority, description, affected_site, client_id } = body

  const resolvedClientId = profile?.role === 'admin' ? client_id : profile?.client_id
  if (!resolvedClientId) return NextResponse.json({ error: 'No client ID' }, { status: 400 })

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      client_id: resolvedClientId,
      created_by: user.id,
      title,
      category,
      priority: priority || 'Medium',
      description,
      affected_site,
      status: 'Open',
    })
    .select('*, client:clients(id, business_name, email, contact_name, package:support_packages(response_time))')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_logs').insert({
    ticket_id: ticket.id,
    client_id: resolvedClientId,
    actor_id: user.id,
    action: 'Ticket created',
    detail: title,
  })

  const clientInfo = ticket.client as any

  // Email + notify admin when client submits a ticket
  if (profile?.role === 'client') {
    const adminEmail = await getAdminEmail()
    await sendNewTicketAlertToAdmin({
      adminEmail,
      clientName: clientInfo?.contact_name || profile.full_name,
      businessName: clientInfo?.business_name || '',
      ticketTitle: title,
      ticketId: ticket.id,
      category: category || '',
      priority: priority || 'Medium',
    })

    await notifyAdmin({
      title: `New ticket from ${clientInfo?.business_name || profile.full_name}`,
      body: title,
      link: `/admin/tickets/${ticket.id}`,
      type: ['Urgent', 'High'].includes(priority) ? 'urgent' : 'info',
    })

    // Confirm receipt to the client
    const responseTime = clientInfo?.package?.response_time || '24 hours'
    await createNotification({
      userId: user.id,
      title: 'Ticket submitted ✓',
      body: `We received your request and will respond within ${responseTime}.`,
      link: `/portal/tickets/${ticket.id}`,
      type: 'success',
    })
  }

  return NextResponse.json(ticket, { status: 201 })
}
