import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isLeader } from '@/lib/permissions'

// Client-side team management. A client account (one client_id) can have
// multiple user logins: one or more Leaders + Members. Only Leaders may invite,
// edit, or remove teammates.

async function caller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, client_id, client_role')
    .eq('id', user.id)
    .single()
  if (!profile?.client_id || profile.role !== 'client') return { error: 'Forbidden', status: 403 as const }
  return { admin: await createAdminClient(), profile }
}

async function teamConfig(admin: any, clientId: string) {
  const { data } = await admin
    .from('clients')
    .select('package:support_packages(team_enabled, team_seats)')
    .eq('id', clientId)
    .single()
  const pkg = (data as any)?.package
  return { enabled: !!pkg?.team_enabled, seats: pkg?.team_seats ?? null }
}

export async function GET() {
  const c = await caller()
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })

  const { data: members } = await c.admin
    .from('profiles')
    .select('id, full_name, email, client_role, can_view_billing, can_view_all_tickets')
    .eq('client_id', c.profile.client_id)
    .eq('role', 'client')
    .order('client_role')
    .order('full_name')

  const cfg = await teamConfig(c.admin, c.profile.client_id)
  return NextResponse.json({
    isLeader: isLeader(c.profile),
    teamEnabled: cfg.enabled,
    seats: cfg.seats,
    members: members || [],
  })
}

export async function POST(request: NextRequest) {
  const c = await caller()
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
  if (!isLeader(c.profile)) return NextResponse.json({ error: 'Only a team leader can add members' }, { status: 403 })
  const admin = c.admin
  const clientId = c.profile.client_id

  // Teams are a plan feature
  const cfg = await teamConfig(admin, clientId)
  if (!cfg.enabled) return NextResponse.json({ error: 'Your plan doesn’t include team members. Contact us to enable it.' }, { status: 403 })
  if (cfg.seats != null) {
    const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('role', 'client')
    if ((count ?? 0) >= cfg.seats) {
      return NextResponse.json({ error: `You’ve reached your plan’s seat limit (${cfg.seats}). Remove a member or upgrade.` }, { status: 403 })
    }
  }

  const body = await request.json()
  const { full_name, email, password } = body
  if (!full_name || !email || !password) return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  })
  let userId = created?.user?.id
  if (createErr || !userId) {
    if (/already.*regist|already.*been/i.test(createErr?.message || '')) {
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = (list?.users || []).find(u => (u.email || '').toLowerCase() === String(email).toLowerCase())
      if (!existing) return NextResponse.json({ error: 'Email is taken but the account could not be found.' }, { status: 500 })
      userId = existing.id
      await admin.auth.admin.updateUserById(userId, { password })
    } else {
      return NextResponse.json({ error: createErr?.message || 'Could not create login' }, { status: 500 })
    }
  }

  // Don't hijack an account that already belongs elsewhere
  const { data: existingProfile } = await admin.from('profiles').select('role, client_id').eq('id', userId).maybeSingle()
  if (existingProfile && (existingProfile.role !== 'client' || (existingProfile.client_id && existingProfile.client_id !== clientId))) {
    return NextResponse.json({ error: 'This email already belongs to another account.' }, { status: 400 })
  }

  const { error: upErr } = await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name,
    role: 'client',
    client_id: clientId,
    client_role: body.client_role === 'leader' ? 'leader' : 'member',
    can_view_billing: !!body.can_view_billing,
    can_view_all_tickets: body.can_view_all_tickets !== false,
  }, { onConflict: 'id' })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: userId }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const c = await caller()
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
  if (!isLeader(c.profile)) return NextResponse.json({ error: 'Only a team leader can edit members' }, { status: 403 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (id === c.profile.id && body.client_role && body.client_role !== 'leader') {
    return NextResponse.json({ error: 'You cannot remove your own Leader role.' }, { status: 400 })
  }

  // Target must belong to the same client
  const { data: target } = await c.admin.from('profiles').select('id, client_id, role').eq('id', id).maybeSingle()
  if (!target || target.client_id !== c.profile.client_id || target.role !== 'client') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const update: any = {
    client_role: body.client_role === 'leader' ? 'leader' : 'member',
    can_view_billing: !!body.can_view_billing,
    can_view_all_tickets: body.can_view_all_tickets !== false,
  }
  if (typeof body.full_name === 'string' && body.full_name.trim()) update.full_name = body.full_name.trim()
  // Leaders implicitly have full access
  if (update.client_role === 'leader') { update.can_view_billing = true; update.can_view_all_tickets = true }

  const { error } = await c.admin.from('profiles').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const c = await caller()
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
  if (!isLeader(c.profile)) return NextResponse.json({ error: 'Only a team leader can remove members' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (id === c.profile.id) return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 })

  const { data: target } = await c.admin.from('profiles').select('id, client_id, role').eq('id', id).maybeSingle()
  if (!target || target.client_id !== c.profile.client_id || target.role !== 'client') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await c.admin.from('profiles').delete().eq('id', id)
  try { await c.admin.auth.admin.deleteUser(id) } catch { /* ignore */ }
  return NextResponse.json({ ok: true })
}
