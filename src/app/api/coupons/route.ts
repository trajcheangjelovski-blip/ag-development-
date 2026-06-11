import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = await createAdminClient()
  const { data, error } = await admin.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ tableMissing: true, coupons: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ tableMissing: false, coupons: data })
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const code = (body.code || '').trim().toUpperCase().replace(/\s+/g, '')
  const percent_off = body.percent_off ? Number(body.percent_off) : null
  const amount_off = body.amount_off ? Number(body.amount_off) : null

  if (!code || code.length < 3) return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 })
  if (!percent_off && !amount_off) return NextResponse.json({ error: 'Set either a percent or a dollar discount' }, { status: 400 })
  if (percent_off && (percent_off < 1 || percent_off > 100)) return NextResponse.json({ error: 'Percent must be 1–100' }, { status: 400 })
  if (amount_off && amount_off < 1) return NextResponse.json({ error: 'Amount must be at least $1' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('coupons')
    .insert({
      code,
      percent_off: percent_off || null,
      amount_off: percent_off ? null : amount_off,
      expires_at: body.expires_at || null,
      max_redemptions: body.max_redemptions ? Number(body.max_redemptions) : null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 })
    if (error.code === '42P01') return NextResponse.json({ error: 'Coupons table missing. Run the COUPONS section from supabase/schema.sql first.' }, { status: 500 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin.from('coupons').update({ is_active: !!is_active }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
