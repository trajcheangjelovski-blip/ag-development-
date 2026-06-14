import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isTyping } from '@/lib/chatTyping'

// Live popup chat between a client and AG. One continuous conversation per
// client. GET also marks the other party's messages as read for the viewer.

async function caller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('id, role, client_id, full_name').eq('id', user.id).single()
  if (!profile) return null
  return { profile, admin: await createAdminClient() }
}

export async function GET(request: NextRequest) {
  const c = await caller()
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { profile, admin } = c

  const clientId = profile.role === 'admin'
    ? new URL(request.url).searchParams.get('client_id')
    : profile.client_id
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  if (profile.role !== 'admin' && profile.client_id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await admin
    .from('chat_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true })

  // Mark the other side's messages read for this viewer
  if (profile.role === 'admin') {
    await admin.from('chat_messages').update({ read_by_admin: true })
      .eq('client_id', clientId).eq('sender_role', 'client').eq('read_by_admin', false)
  } else {
    await admin.from('chat_messages').update({ read_by_client: true })
      .eq('client_id', clientId).eq('sender_role', 'admin').eq('read_by_client', false)
  }

  const othersTyping = isTyping(clientId, profile.role === 'admin' ? 'client' : 'admin')
  return NextResponse.json({ messages: data || [], othersTyping })
}

export async function POST(request: NextRequest) {
  const c = await caller()
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { profile, admin } = c

  const body = await request.json()
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const clientId = profile.role === 'admin' ? body.client_id : profile.client_id
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  if (profile.role !== 'admin' && profile.client_id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isAdmin = profile.role === 'admin'
  const { data, error } = await admin.from('chat_messages').insert({
    client_id: clientId,
    sender_id: profile.id,
    sender_role: isAdmin ? 'admin' : 'client',
    body: text,
    read_by_admin: isAdmin,
    read_by_client: !isAdmin,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
