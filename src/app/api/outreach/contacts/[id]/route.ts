import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOutreachAdmin } from '@/lib/outreach'

// PATCH  /api/outreach/contacts/:id  → update consent / opt-out
// DELETE /api/outreach/contacts/:id  → remove a contact

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => ({})) as { opted_out?: boolean; consent_status?: string; company_name?: string }
  const patch: Record<string, unknown> = {}
  if (typeof body.opted_out === 'boolean') {
    patch.opted_out = body.opted_out
    patch.opted_out_at = body.opted_out ? new Date().toISOString() : null
  }
  if (['granted', 'unknown', 'declined'].includes(body.consent_status || '')) patch.consent_status = body.consent_status
  if (typeof body.company_name === 'string') patch.company_name = body.company_name.trim() || null
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('outreach_contacts').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params

  const admin = await createAdminClient()
  const { error } = await admin.from('outreach_contacts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
