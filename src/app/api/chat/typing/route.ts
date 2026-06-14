import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setTyping } from '@/lib/chatTyping'

// Records that the caller is typing in a client's chat (throttled by the client).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const clientId = profile.role === 'admin' ? body.client_id : profile.client_id
  if (!clientId) return NextResponse.json({ ok: false })
  if (profile.role !== 'admin' && profile.client_id !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  setTyping(clientId, profile.role === 'admin' ? 'admin' : 'client')
  return NextResponse.json({ ok: true })
}
