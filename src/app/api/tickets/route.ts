import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewTicketAlertToAdmin, sendNewCommentNotification } from '@/lib/email'
import { createNotification, notifyAdmin, getClientProfileId } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'
import { getClientPlanState } from '@/lib/planUsage'

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

  // A "Message" is a free, always-available contact channel — it does NOT
  // consume support credits and is never blocked by plan expiry/exhaustion.
  const isMessage = body.kind === 'message' || category === 'Message'

  const resolvedClientId = profile?.role === 'admin' ? client_id : profile?.client_id
  if (!resolvedClientId) return NextResponse.json({ error: 'No client ID' }, { status: 400 })

  // Enforce plan credits & expiry for clients (admins can always create).
  // Messages skip this check so clients can always reach us, even when expired.
  if (profile?.role === 'client' && !isMessage) {
    const plan = await getClientPlanState(resolvedClientId)
    if (plan?.blocked) {
      return NextResponse.json(
        { error: `${plan.blockReason} You can order extra credits or renew your plan from your dashboard.` },
        { status: 403 },
      )
    }
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      client_id: resolvedClientId,
      created_by: user.id,
      title,
      category: isMessage ? 'Message' : category,
      priority: isMessage ? 'Low' : (priority || 'Medium'),
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

  // Email + notify admin when client submits a ticket/message
  if (profile?.role === 'client') {
    const adminEmail = await getAdminEmail()
    // Fire-and-forget — don't block submission on SMTP delivery
    sendNewTicketAlertToAdmin({
      adminEmail,
      clientName: clientInfo?.contact_name || profile.full_name,
      businessName: clientInfo?.business_name || '',
      ticketTitle: title,
      ticketId: ticket.id,
      category: category || '',
      priority: priority || 'Medium',
    }).catch(e => console.error('Email error:', e))

    await notifyAdmin({
      title: isMessage
        ? `New message from ${clientInfo?.business_name || profile.full_name}`
        : `New ticket from ${clientInfo?.business_name || profile.full_name}`,
      body: title,
      // Messages live in the dedicated Messages inbox; tickets in the ticket view.
      link: isMessage ? '/admin/messages' : `/admin/tickets/${ticket.id}`,
      type: isMessage ? 'info' : (['Urgent', 'High'].includes(priority) ? 'urgent' : 'info'),
    })

    // Confirm receipt to the client
    const responseTime = clientInfo?.package?.response_time || '24 hours'
    await createNotification({
      userId: user.id,
      title: isMessage ? 'Message sent ✓' : 'Ticket submitted ✓',
      body: isMessage
        ? 'Your message has been sent to AG Development. We’ll get back to you by email and here in your portal.'
        : `We received your request and will respond within ${responseTime}.`,
      // Link confirmations to the thread view — never to the /portal/message
      // list, so a client's own send doesn't inflate their unread-message badge.
      link: isMessage ? `/portal/message/${ticket.id}` : `/portal/tickets/${ticket.id}`,
      type: 'success',
    })
  }

  // Admin started a message to a client → email + notify that client.
  if (profile?.role === 'admin' && isMessage) {
    const clientProfileId = await getClientProfileId(resolvedClientId)
    if (clientProfileId) {
      await createNotification({
        userId: clientProfileId,
        title: 'New message from AG Development',
        body: title,
        link: '/portal/message',
        type: 'info',
      })
    }
    if (clientInfo?.email) {
      // Fire-and-forget — don't block sending on SMTP delivery
      sendNewCommentNotification({
        toEmail: clientInfo.email,
        toName: clientInfo?.contact_name,
        ticketTitle: title,
        ticketId: ticket.id,
        authorName: 'AG Development',
        commentBody: description || title,
      }).catch(e => console.error('Email error:', e))
    }
  }

  return NextResponse.json(ticket, { status: 201 })
}
