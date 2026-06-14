import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Unread chat count for the current user (for the floating bubble badge).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ unread: 0 })
  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ unread: 0 })

  const admin = await createAdminClient()
  let q = admin.from('chat_messages').select('*', { count: 'exact', head: true })
  if (profile.role === 'admin') {
    q = q.eq('sender_role', 'client').eq('read_by_admin', false)
  } else {
    if (!profile.client_id) return NextResponse.json({ unread: 0 })
    q = q.eq('client_id', profile.client_id).eq('sender_role', 'admin').eq('read_by_client', false)
  }
  const { count } = await q
  return NextResponse.json({ unread: count || 0 })
}
