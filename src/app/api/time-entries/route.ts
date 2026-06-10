import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const ticketId = params.get('ticket_id')
  const clientId = params.get('client_id')
  const month = params.get('month')

  let query = supabase
    .from('time_entries')
    .select('*, logger:profiles!logged_by(id, full_name)')
    .order('work_date', { ascending: false })

  if (ticketId) query = query.eq('ticket_id', ticketId)
  if (clientId) query = query.eq('client_id', clientId)
  if (month) query = query.eq('billing_month', month)

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
  const { ticket_id, client_id, work_date, minutes, work_note, is_billable, is_included_in_package } = body

  const billing_month = work_date.substring(0, 7)

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert({ ticket_id, client_id, logged_by: user.id, work_date, minutes, work_note, is_billable: is_billable ?? false, is_included_in_package: is_included_in_package ?? true, billing_month })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Activity log
  await supabase.from('activity_logs').insert({
    ticket_id,
    client_id,
    actor_id: user.id,
    action: 'Time entry added',
    detail: `${minutes} min — ${work_note}`,
  })

  return NextResponse.json(entry, { status: 201 })
}
