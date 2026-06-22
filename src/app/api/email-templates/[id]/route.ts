import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'

// Delete a template. Admins can only delete templates they own.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase
    .from('profiles').select('role, admin_role, permissions').eq('id', user.id).single()
  if (profile?.role !== 'admin' || !can(profile as any, 'emails.send')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_templates')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Template not found or not yours to delete' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
