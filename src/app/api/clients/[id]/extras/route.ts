import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Per-client extras ledger: track usage of purchased extras
// (e.g. "Extra Website Page — 1 of 2 used").

async function getCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  return profile ? { user, profile } : null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (caller.profile.role !== 'admin' && caller.profile.client_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('client_extras')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at')

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ tableMissing: true, extras: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ tableMissing: false, extras: data })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller()
  if (!caller || caller.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, qty_total } = await request.json()
  if (!name?.trim() || !qty_total || qty_total < 1) {
    return NextResponse.json({ error: 'Name and a quantity of at least 1 are required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('client_extras')
    .insert({ client_id: params.id, name: name.trim(), qty_total: Number(qty_total), qty_used: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller()
  if (!caller || caller.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { extra_id, delta, note } = await request.json()
  if (!extra_id || ![1, -1].includes(delta)) {
    return NextResponse.json({ error: 'extra_id and delta of 1 or -1 required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: extra } = await admin.from('client_extras').select('*').eq('id', extra_id).eq('client_id', params.id).maybeSingle()
  if (!extra) return NextResponse.json({ error: 'Extra not found' }, { status: 404 })

  const next = Math.min(extra.qty_total, Math.max(0, extra.qty_used + delta))
  const { data, error } = await admin
    .from('client_extras')
    .update({ qty_used: next })
    .eq('id', extra_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log usage so it shows in activity feeds (client + admin)
  if (delta === 1 && next !== extra.qty_used) {
    await admin.from('activity_logs').insert({
      client_id: params.id,
      actor_id: caller.user.id,
      action: 'Extra used',
      detail: `${extra.name} — ${next} of ${extra.qty_total} used${note ? ` (${note})` : ''}`,
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller()
  if (!caller || caller.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const extraId = new URL(request.url).searchParams.get('extra_id')
  if (!extraId) return NextResponse.json({ error: 'extra_id required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('client_extras').delete().eq('id', extraId).eq('client_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
