import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendClientInvite } from '@/lib/email'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('clients')
    .select('*, package:support_packages(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { business_name, contact_name, email, phone, website, package_id, notes } = body

  if (!business_name || !contact_name || !email) {
    return NextResponse.json({ error: 'business_name, contact_name, and email are required' }, { status: 400 })
  }

  // Create client record
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({ business_name, contact_name, email, phone, website, package_id, notes })
    .select()
    .single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  const { password } = body

  if (!password || password.length < 8) {
    await supabase.from('clients').delete().eq('id', client.id)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Create Supabase auth user with the admin-chosen password
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: contact_name, role: 'client' },
  })

  if (authError) {
    await supabase.from('clients').delete().eq('id', client.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Link the auth user profile to the client record
  await adminSupabase
    .from('profiles')
    .update({ client_id: client.id, role: 'client' })
    .eq('id', authUser.user.id)

  // Send invite email with the password the admin set
  await sendClientInvite({ clientEmail: email, clientName: contact_name, tempPassword: password })

  return NextResponse.json({ client }, { status: 201 })
}
