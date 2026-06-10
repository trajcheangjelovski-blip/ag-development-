import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification, getClientProfileId } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticketId = new URL(request.url).searchParams.get('ticket_id')
  if (!ticketId) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('proof_uploads')
    .select('*, uploader:profiles!uploaded_by(id, full_name)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })

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
  const { ticket_id, before_note, after_note, before_image_url, after_image_url, video_link, completion_note } = body

  const { data: proof, error } = await supabase
    .from('proof_uploads')
    .insert({ ticket_id, uploaded_by: user.id, before_note, after_note, before_image_url, after_image_url, video_link, completion_note })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, title, client_id')
    .eq('id', ticket_id)
    .single()

  if (ticket) {
    await supabase.from('activity_logs').insert({
      ticket_id,
      client_id: ticket.client_id,
      actor_id: user.id,
      action: 'Proof uploaded',
      detail: 'Before/after proof added',
    })

    // Notify client
    const clientProfileId = await getClientProfileId(ticket.client_id)
    if (clientProfileId) {
      await createNotification({
        userId: clientProfileId,
        title: 'Proof of work uploaded ✅',
        body: ticket.title,
        link: `/portal/tickets/${ticket_id}`,
        type: 'success',
      })
    }
  }

  return NextResponse.json(proof, { status: 201 })
}
