import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('clients')
    .select('*, package:support_packages(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // Assigning a (new) plan starts a fresh 1-month plan period
  const { data: existing } = await supabase.from('clients').select('package_id').eq('id', params.id).single()
  const planChanged = !!body.package_id && body.package_id !== existing?.package_id
  if (planChanged) {
    const start = new Date()
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    body.plan_started_at = start.toISOString()
    body.plan_expires_at = end.toISOString()
  }

  const { data, error } = await supabase.from('clients').update(body).eq('id', params.id).select('*, package:support_packages(*)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create the extras tracking ledger from the package's structured extras
  if (planChanged) {
    const pkgExtras = (data.package as any)?.extras
    if (Array.isArray(pkgExtras) && pkgExtras.length) {
      const admin = await createAdminClient()
      const unitFor = (t: string) => (t === 'hours' ? 'hours' : t === 'tickets' ? 'tickets' : 'items')
      await admin.from('client_extras').insert(
        pkgExtras.map((x: any) => ({
          client_id: params.id,
          name: x.name,
          qty_total: Math.max(1, Math.round((Number(x.qty) || 1) * (Number(x.grant_qty) || 1))),
          qty_used: 0,
          unit: unitFor(x.grant_type),
        })),
      ).then(({ error: e }) => { if (e) console.error('Extras ledger seed error:', e) })
    }
  }

  return NextResponse.json(data)
}
