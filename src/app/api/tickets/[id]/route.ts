import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendTicketStatusUpdate, sendTicketReopenedToAdmin } from '@/lib/email'
import { createNotification, notifyAdmin, getClientProfileId } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`*, client:clients(*, package:support_packages(*)), creator:profiles!created_by(id, full_name, role)`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        .eq('id', params.id)
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
        .eq('id', params.id)

      console.log('Update error:', updateError)

      if (updateError) {
        console.error('Failed to update ticket:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Fetch the updated row separately (no RETURNING join issue)
      const { data: updatedTicket } = await adminSupabase
        .from('tickets')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      const reason = body.reason || 'No reason provided'

      // Fire-and-forget side effects — errors here must not fail the response
      const sideEffects = [
        adminSupabase.from('ticket_comments').insert({
          ticket_id: params.id,
          author_id: user.id,
          body: `🔄 Ticket reopened by client.\n\nReason: ${reason}`,
          comment_type: 'public',
        }),
        adminSupabase.from('activity_logs').insert({
          ticket_id: params.id,
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
            link: `/admin/tickets/${params.id}`,
            type: 'warning',
            is_read: false,
          }))
        ).then(({ error: e }) => { if (e) console.error('Notification insert error:', e) })
      }

      try {
        await sendTicketReopenedToAdmin({
          adminEmail: await getAdminEmail(),
          clientName: profile.full_name,
          businessName: (existingTicket.client as any)?.business_name || '',
          ticketTitle: existingTicket.title,
          ticketId: params.id,
          reason,
        })
      } catch (emailError) {
        console.error('Email error:', emailError)
      }

      return NextResponse.json(updatedTicket ?? { ...existingTicket, status: 'Open' })
    }

    // ── Admin flow ────────────────────────────────────────────────────────────
    if (profile.role === 'admin') {
      // Separate UPDATE from SELECT to avoid "Cannot coerce" with joined RETURNING
      const { error: updateError } = await adminSupabase
        .from('tickets')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', params.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Fetch fresh data with join in a separate SELECT
      const { data: updatedTicket, error: selectError } = await adminSupabase
        .from('tickets')
        .select('*, client:clients(id, email, contact_name, business_name)')
        .eq('id', params.id)
        .maybeSingle()

      if (selectError) {
        return NextResponse.json({ error: selectError.message }, { status: 500 })
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
            link: `/portal/tickets/${params.id}`,
            type: body.status === 'Completed' ? 'success' : 'info',
            is_read: false,
          }).then(({ error: e }) => { if (e) console.error('Notification insert error:', e) })
        }

        await adminSupabase.from('activity_logs').insert({
          ticket_id: params.id,
          client_id: updatedTicket.client_id,
          actor_id: user.id,
          action: 'Status changed',
          detail: `Status updated to ${body.status}`,
        })

        try {
          await sendTicketStatusUpdate({
            clientEmail: (updatedTicket.client as any).email,
            clientName: (updatedTicket.client as any).contact_name,
            ticketTitle: updatedTicket.title,
            ticketId: params.id,
            newStatus: body.status,
          })
        } catch (emailError) {
          console.error('Email error:', emailError)
        }
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
