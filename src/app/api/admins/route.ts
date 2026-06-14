import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ALL_GRANTABLE, isMaster } from '@/lib/permissions'

// Master-only management of admin accounts: list, create, update, remove.
// Permission enforcement on the rest of the app is applied per-route (Phase 2);
// this endpoint itself is strictly master-only.

async function requireMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).single()
  if (!isMaster(profile)) return { error: 'Forbidden', status: 403 as const }
  return { admin: await createAdminClient(), callerId: user.id }
}

function sanitizePerms(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.filter(p => typeof p === 'string' && ALL_GRANTABLE.includes(p))
}

async function setAssignments(admin: any, adminId: string, scope: string, clientIds: unknown) {
  await admin.from('admin_client_assignments').delete().eq('admin_id', adminId)
  if (scope === 'assigned' && Array.isArray(clientIds) && clientIds.length) {
    await admin.from('admin_client_assignments').insert(
      clientIds.filter((c: unknown) => typeof c === 'string').map((client_id: string) => ({ admin_id: adminId, client_id }))
    )
  }
}

export async function GET() {
  const ctx = await requireMaster()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const admin = ctx.admin

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email, role, admin_role, permissions, client_scope, avatar_url')
    .eq('role', 'admin')
    .order('full_name')

  const { data: assignments } = await admin.from('admin_client_assignments').select('admin_id, client_id')
  const byAdmin: Record<string, string[]> = {}
  for (const a of assignments || []) (byAdmin[a.admin_id] ||= []).push(a.client_id)

  const admins = (profiles || []).map(p => ({
    ...p,
    email: (p as any).email || '',
    assignedClientIds: byAdmin[p.id] || [],
  }))

  return NextResponse.json({ admins })
}

export async function POST(request: NextRequest) {
  const ctx = await requireMaster()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const admin = ctx.admin

  const body = await request.json()
  const { email, password, full_name, admin_role, client_scope } = body
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  // Resolve the auth user id. If the email already exists (e.g. a previous
  // partial create), reuse that account and (re)set its password instead.
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

  const scope = client_scope === 'assigned' ? 'assigned' : 'all'
  const { error: upErr } = await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name,
    role: 'admin',
    admin_role: admin_role || 'support',
    permissions: sanitizePerms(body.permissions),
    client_scope: scope,
  }, { onConflict: 'id' })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  await setAssignments(admin, userId, scope, body.clientIds)
  return NextResponse.json({ ok: true, id: userId }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireMaster()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const admin = ctx.admin

  const body = await request.json()
  const { id, full_name, admin_role, client_scope } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (id === ctx.callerId && admin_role && admin_role !== 'master') {
    return NextResponse.json({ error: 'You cannot remove your own Master role.' }, { status: 400 })
  }

  const scope = client_scope === 'assigned' ? 'assigned' : 'all'
  const update: any = {
    admin_role: admin_role || 'support',
    permissions: sanitizePerms(body.permissions),
    client_scope: scope,
  }
  if (typeof full_name === 'string' && full_name.trim()) update.full_name = full_name.trim()

  const { error } = await admin.from('profiles').update(update).eq('id', id).eq('role', 'admin')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await setAssignments(admin, id, scope, body.clientIds)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireMaster()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const admin = ctx.admin

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (id === ctx.callerId) return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })

  // Removing the auth user cascades the profile if your DB is set up that way;
  // delete the profile explicitly too to be safe.
  await admin.from('profiles').delete().eq('id', id).eq('role', 'admin')
  try { await admin.auth.admin.deleteUser(id) } catch { /* ignore */ }
  return NextResponse.json({ ok: true })
}
