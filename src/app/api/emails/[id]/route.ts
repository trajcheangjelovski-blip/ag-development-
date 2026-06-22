import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'

async function requireEmailAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role, permissions')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin' || !can(profile as any, 'emails.send')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return {}
}

// Delete a campaign from the history. A campaign that is mid-send ('sending')
// is left alone to avoid yanking the row out from under the sender; deleting a
// 'scheduled' one also cancels it, since the cron only picks up rows that exist.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_campaigns')
    .delete()
    .eq('id', id)
    .neq('status', 'sending')
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Campaign not found or currently sending' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}

// Cancel a scheduled campaign without deleting it (keeps the audit record).
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_campaigns')
    .update({ status: 'canceled' })
    .eq('id', id)
    .eq('status', 'scheduled')
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Campaign not found or already sending/sent' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
