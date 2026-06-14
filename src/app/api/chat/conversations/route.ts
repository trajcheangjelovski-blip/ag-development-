import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Admin: list of client chat conversations with last message + unread count.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data } = await admin
    .from('chat_messages')
    .select('client_id, body, created_at, sender_role, read_by_admin, client:clients(business_name)')
    .order('created_at', { ascending: false })

  const map: Record<string, any> = {}
  for (const m of data || []) {
    const k = m.client_id
    if (!map[k]) {
      map[k] = { client_id: k, name: (m as any).client?.business_name || 'Client', last_body: m.body, last_at: m.created_at, unread: 0 }
    }
    if (m.sender_role === 'client' && !m.read_by_admin) map[k].unread++
  }

  return NextResponse.json({ conversations: Object.values(map) })
}
