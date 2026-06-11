import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('support_packages').select('*').eq('is_active', true).order('price')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Admin: create a custom support package (assign to a client via Edit Client).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, description, extras } = body
  if (!name?.trim() || typeof price !== 'number' || price < 0) {
    return NextResponse.json({ error: 'Name and a valid price are required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('support_packages')
    .insert({
      name: name.trim(),
      price,
      requests_per_month: Number(requests_per_month) || 0,
      hours_per_month: Number(hours_per_month) || 0,
      response_time: response_time?.trim() || '24 hours',
      extra_hourly_rate: Number(extra_hourly_rate) || 10,
      description: description?.trim() || null,
      extras: Array.isArray(extras) && extras.length ? extras : null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// Admin: delete a support package. If clients are still assigned to it,
// it is deactivated (hidden) instead of deleted.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = await createAdminClient()

  // Check if any client uses this plan
  const { count } = await admin
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('package_id', id)

  if (count && count > 0) {
    const { error } = await admin.from('support_packages').update({ is_active: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      deactivated: true,
      message: `${count} client(s) are on this plan — it was hidden instead of deleted. Reassign them first to delete it permanently.`,
    })
  }

  const { error } = await admin.from('support_packages').delete().eq('id', id)
  if (error) {
    // FK from elsewhere — fall back to hiding
    await admin.from('support_packages').update({ is_active: false }).eq('id', id)
    return NextResponse.json({ ok: true, deactivated: true, message: 'Plan is referenced by other records — hidden instead of deleted.' })
  }
  return NextResponse.json({ ok: true, deactivated: false })
}
