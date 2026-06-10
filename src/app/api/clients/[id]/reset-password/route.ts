import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/clients/:id/reset-password
// Admin sets a new password for a client directly
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { password } = await request.json()
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Get the client's email to find their auth user
  const { data: client } = await supabase.from('clients').select('email').eq('id', params.id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Find the auth user by email
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(u => u.email === client.email)
  if (!authUser) return NextResponse.json({ error: 'No login account found for this client' }, { status: 404 })

  // Update their password
  const { error } = await adminSupabase.auth.admin.updateUserById(authUser.id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
