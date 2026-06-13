import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPlans, effectivePrice } from '@/lib/plans'
import { getCardDefaults } from '@/lib/planDefaults'

// GET: public — active plans with effective (sale-aware) prices.
//      Content fields fall back to the built-in site card copy, so the admin
//      editor always shows what's actually displayed on the website.
// PATCH: admin — update a plan (upserts so first edit works even pre-seed).
export async function GET(request: NextRequest) {
  const { plans } = await getPlans()

  // Admins also see hidden plans (so they can re-enable them)
  let includeHidden = false
  if (new URL(request.url).searchParams.get('all') === '1') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      includeHidden = profile?.role === 'admin'
    }
  }

  return NextResponse.json(
    plans
      .filter(p => includeHidden || p.is_active)
      .map(p => {
        const d = getCardDefaults(p.id)
        return {
          ...p,
          badge: p.badge ?? d?.badge ?? null,
          features: p.features ?? d?.features ?? null,
          details: p.details ?? d?.details ?? null,
          good_for: p.good_for ?? d?.good_for ?? null,
          delivery: p.delivery ?? d?.delivery ?? null,
          description: p.description || d?.description || '',
          effective_price: effectivePrice(p),
        }
      }),
  )
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, name, description, category, price, billing_interval, sale_price, sale_active, is_active, sort, badge, features, details, good_for, delivery, grant_type, grant_qty } = body
  if (!id || !name || !category || typeof price !== 'number' || price < 0) {
    return NextResponse.json({ error: 'id, name, category and a valid price are required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('plans')
    .upsert({
      id,
      name,
      description: description ?? '',
      category,
      price,
      billing_interval: billing_interval || null,
      sale_price: sale_price ?? null,
      sale_active: !!sale_active,
      is_active: is_active !== false,
      sort: sort ?? 0,
      badge: badge?.trim() || null,
      features: Array.isArray(features) && features.length ? features : null,
      details: Array.isArray(details) && details.length ? details : null,
      good_for: good_for?.trim() || null,
      delivery: delivery?.trim() || null,
      grant_type: grant_type || null,
      grant_qty: Number(grant_qty) || 1,
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Plans table missing. Run the PLANS section from supabase/schema.sql in your Supabase SQL editor first.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// DELETE: admin — permanently remove a plan/extra by id.
// Client ledgers snapshot extras by name/price (no FK to plans), so deleting
// here only removes the sellable item; existing client records are untouched.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('plans').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'This item is still referenced elsewhere and can’t be deleted. Hide it instead (uncheck "Active" in the editor).' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
