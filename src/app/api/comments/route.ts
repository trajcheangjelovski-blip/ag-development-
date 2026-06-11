import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewCommentNotification } from '@/lib/email'
import { createNotification, notifyAdmin, getClientProfileId } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const ticketId = new URL(request.url).searchParams.get('ticket_id')
  if (!ticketId) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

  let query = supabase
    .from('ticket_comments')
    .select('*, author:profiles(id, full_name, role, avatar_url)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (profile?.role !== 'admin') query = query.eq('comment_type', 'public')

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
  const { ticket_id, body: commentBody, comment_type } = body

  const resolvedType = profile?.role === 'admin' ? (comment_type || 'public') : 'public'

  const { data: comment, error } = await supabase
    .from('ticket_comments')
    .insert({ ticket_id, author_id: user.id, body: commentBody, comment_type: resolvedType })
    .select('*, author:profiles(id, full_name, role, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, client:clients(id, email, contact_name, business_name)')
    .eq('id', ticket_id)
    .single()

  if (ticket) {
    await supabase.from('activity_logs').insert({
      ticket_id,
      client_id: ticket.client_id,
      actor_id: user.id,
      action: 'Comment added',
      detail: resolvedType === 'internal' ? 'Internal note added' : `${profile?.full_name} replied`,
    })

    if (resolvedType === 'public') {
      const clientInfo = ticket.client as any

      if (profile?.role === 'admin') {
        // Email + notify client
        await sendNewCommentNotification({
          toEmail: clientInfo?.email,
          toName: clientInfo?.contact_name,
          ticketTitle: ticket.title,
          ticketId: ticket_id,
          authorName: 'AG Development',
          commentBody,
        })

        const clientProfileId = await getClientProfileId(ticket.client_id)
        if (clientProfileId) {
          await createNotification({
            userId: clientProfileId,
            title: 'New reply from AG Development',
            body: commentBody.slice(0, 120),
            link: `/portal/tickets/${ticket_id}`,
            type: 'info',
          })
        }
      } else {
        // Email + notify admin
        await sendNewCommentNotification({
          toEmail: await getAdminEmail(),
          toName: 'Admin',
          ticketTitle: ticket.title,
          ticketId: ticket_id,
          authorName: profile?.full_name || 'Client',
          commentBody,
        })

        await notifyAdmin({
          title: `New message from ${clientInfo?.business_name || profile?.full_name}`,
          body: commentBody.slice(0, 120),
          link: `/admin/tickets/${ticket_id}`,
          type: 'info',
        })
      }
    }
  }

  return NextResponse.json(comment, { status: 201 })
}
