import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendTicketStatusUpdate, sendTicketReopenedToAdmin } from '@/lib/email'
import { createNotification, notifyAdmin, getClientProfileId } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`*, client:clients(*, package:support_packages(*)), creator:profiles!created_by(id, full_name, role)`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // maybeSingle — never throws "Cannot coerce" even if profile is missing
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await request.json()
    console.log('PATCH ticket body:', body)
    console.log('User profile:', profile.role, profile.client_id)

    // ── Client reopen flow ────────────────────────────────────────────────────
    if (profile.role === 'client' && body.status === 'Open') {
      // Fetch ticket by ID only — check ownership in code to avoid silent mismatches
      const { data: existingTicket, error: fetchError } = await adminSupabase
        .from('tickets')
        .select('*, client:clients(id, email, contact_name, business_name)')
        .eq('id', id)
        .maybeSingle()

      console.log('Ticket found:', existingTicket?.id, 'Status:', existingTicket?.status)
      console.log('Ticket client_id:', existingTicket?.client_id)
      console.log('Profile client_id:', profile.client_id)
      console.log('Fetch error:', fetchError)

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }
      if (!existingTicket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }
      if (existingTicket.client_id !== profile.client_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      if (!['Completed', 'Closed'].includes(existingTicket.status)) {
        return NextResponse.json({ error: 'Ticket cannot be reopened' }, { status: 400 })
      }

      // Separate UPDATE from SELECT — avoids PostgREST "Cannot coerce" on RETURNING
      const { error: updateError } = await adminSupabase
        .from('tickets')
        .update({ status: 'Open', updated_at: new Date().toISOString() })
        .eq('id', id)

      console.log('Update error:', updateError)

      if (updateError) {
        console.error('Failed to update ticket:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Fetch the updated row separately (no RETURNING join issue)
      const { data: updatedTicket } = await adminSupabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      const reason = body.reason || 'No reason provided'

      // Fire-and-forget side effects — errors here must not fail the response
      const sideEffects = [
        adminSupabase.from('ticket_comments').insert({
          ticket_id: id,
          author_id: user.id,
          body: `🔄 Ticket reopened by client.\n\nReason: ${reason}`,
          comment_type: 'public',
        }),
        adminSupabase.from('activity_logs').insert({
          ticket_id: id,
          client_id: profile.client_id,
          actor_id: user.id,
          action: 'Ticket reopened',
          detail: `Client reopened: ${reason}`,
        }),
      ]

      await Promise.allSettled(sideEffects)

      // Notify all admin users
      const { data: adminProfiles } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (adminProfiles && adminProfiles.length > 0) {
        await adminSupabase.from('notifications').insert(
          adminProfiles.map((a: { id: string }) => ({
            user_id: a.id,
            title: `🔄 Ticket reopened by ${profile.full_name}`,
            body: existingTicket.title,
            link: `/admin/tickets/${id}`,
            type: 'warning',
            is_read: false,
          }))
        ).then(({ error: e }) => { if (e) console.error('Notification insert error:', e) })
      }

      // Fire-and-forget — don't block the reopen on email delivery
      getAdminEmail().then(adminEmail =>
        sendTicketReopenedToAdmin({
          adminEmail,
          clientName: profile.full_name,
          businessName: (existingTicket.client as any)?.business_name || '',
          ticketTitle: existingTicket.title,
          ticketId: id,
          reason,
        })
      ).catch(e => console.error('Email error:', e))

      return NextResponse.json(updatedTicket ?? { ...existingTicket, status: 'Open' })
    }

    // ── Client close flow ─────────────────────────────────────────────────────
    if (profile.role === 'client' && body.status === 'Closed') {
      const { data: existingTicket } = await adminSupabase
        .from('tickets')
        .select('*, client:clients(business_name)')
        .eq('id', id)
        .maybeSingle()

      if (!existingTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      if (existingTicket.client_id !== profile.client_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      if (['Completed', 'Closed'].includes(existingTicket.status)) {
        return NextResponse.json({ error: 'Ticket is already resolved' }, { status: 400 })
      }

      const { error: updateError } = await adminSupabase
        .from('tickets')
        .update({ status: 'Closed', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      await Promise.allSettled([
        adminSupabase.from('ticket_comments').insert({
          ticket_id: id,
          author_id: user.id,
          body: '🔒 Ticket closed by client.',
          comment_type: 'public',
        }),
        adminSupabase.from('activity_logs').insert({
          ticket_id: id,
          client_id: profile.client_id,
          actor_id: user.id,
          action: 'Ticket closed',
          detail: 'Closed by client',
        }),
      ])

      const { data: adminProfiles } = await adminSupabase.from('profiles').select('id').eq('role', 'admin')
      if (adminProfiles?.length) {
        await adminSupabase.from('notifications').insert(
          adminProfiles.map((a: { id: string }) => ({
            user_id: a.id,
            title: `🔒 Ticket closed by ${profile.full_name}`,
            body: existingTicket.title,
            link: `/admin/tickets/${id}`,
            type: 'info',
            is_read: false,
          }))
        ).then(({ error: e }) => { if (e) console.error('Notification insert error:', e) })
      }

      const { data: updatedTicket } = await adminSupabase.from('tickets').select('*').eq('id', id).maybeSingle()
      return NextResponse.json(updatedTicket ?? { ...existingTicket, status: 'Closed' })
    }

    // ── Admin flow ────────────────────────────────────────────────────────────
    if (profile.role === 'admin') {
      // Separate UPDATE from SELECT to avoid "Cannot coerce" with joined RETURNING
      const { error: updateError } = await adminSupabase
        .from('tickets')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Fetch fresh data with join in a separate SELECT
      const { data: updatedTicket, error: selectError } = await adminSupabase
        .from('tickets')
        .select('*, client:clients(id, email, contact_name, business_name)')
        .eq('id', id)
        .maybeSingle()

      if (selectError) {
        return NextResponse.json({ error: selectError.message }, { status: 500 })
      }

      // System message in the conversation thread when the ticket is resolved
      if (body.status === 'Closed' || body.status === 'Completed') {
        await adminSupabase.from('ticket_comments').insert({
          ticket_id: id,
          author_id: user.id,
          body: body.status === 'Completed'
            ? '✅ Ticket marked as completed by AG Development. If anything still needs attention, you can reopen this ticket.'
            : '🔒 Ticket closed by AG Development. If you need further help, you can reopen this ticket from your portal.',
          comment_type: 'public',
        })
      }

      if (body.status && updatedTicket?.client) {
        // maybeSingle — client might not have a portal profile yet
        const { data: clientProfile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('client_id', updatedTicket.client_id)
          .maybeSingle()

        if (clientProfile) {
          await adminSupabase.from('notifications').insert({
            user_id: clientProfile.id,
            title: body.status === 'Completed'
              ? `✅ Ticket completed: ${updatedTicket.title}`
              : `📋 Ticket status updated to ${body.status}`,
            body: updatedTicket.title,
            link: `/portal/tickets/${id}`,
            type: body.status === 'Completed' ? 'success' : 'info',
            is_read: false,
          }).then(({ error: e }) => { if (e) console.error('Notification insert error:', e) })
        }

        await adminSupabase.from('activity_logs').insert({
          ticket_id: id,
          client_id: updatedTicket.client_id,
          actor_id: user.id,
          action: 'Status changed',
          detail: `Status updated to ${body.status}`,
        })

        // Fire-and-forget — don't block the status update on email delivery
        sendTicketStatusUpdate({
          clientEmail: (updatedTicket.client as any).email,
          clientName: (updatedTicket.client as any).contact_name,
          ticketTitle: updatedTicket.title,
          ticketId: id,
          newStatus: body.status,
        }).catch(e => console.error('Email error:', e))
      }

      return NextResponse.json(updatedTicket)
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  } catch (err: any) {
    console.error('PATCH ticket error:', err?.message, err?.code, err?.details, err?.hint)
    return NextResponse.json({
      error: err?.message || 'Internal server error',
      details: err?.details,
      hint: err?.hint,
    }, { status: 500 })
  }
}

// DELETE:
//  • Messages — a per-side delete. The caller's copy is hidden; the other party
//    keeps theirs. Once BOTH sides have hidden it, the row is removed for real
//    (comments/activity cascade). Clients may delete only their own messages.
//  • Tickets — admin-only hard delete (cascades).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  const admin = await createAdminClient()

  const { data: ticket } = await admin
    .from('tickets')
    .select('id, category, client_id, hidden_for_admin, hidden_for_client')
    .eq('id', id)
    .maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMessage = ticket.category === 'Message'

  // Regular tickets: admin-only hard delete (unchanged behavior).
  if (!isMessage) {
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { error } = await admin.from('tickets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Messages: per-side soft delete.
  let hiddenForAdmin = ticket.hidden_for_admin
  let hiddenForClient = ticket.hidden_for_client
  if (profile?.role === 'admin') {
    hiddenForAdmin = true
  } else {
    if (ticket.client_id !== profile?.client_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    hiddenForClient = true
  }

  // Both parties removed it → delete for real.
  if (hiddenForAdmin && hiddenForClient) {
    const { error } = await admin.from('tickets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: true })
  }

  const { error } = await admin
    .from('tickets')
    .update({ hidden_for_admin: hiddenForAdmin, hidden_for_client: hiddenForClient })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, hidden: true })
}
