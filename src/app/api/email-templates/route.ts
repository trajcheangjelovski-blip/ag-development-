import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'

// Reusable email templates. Each admin sees their own templates plus any marked
// "shared". Templates store subject, HTML body, and optional attachment metadata.

async function requireEmailAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase
    .from('profiles').select('role, admin_role, permissions').eq('id', user.id).single()
  if (profile?.role !== 'admin' || !can(profile as any, 'emails.send')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id }
}

function missingTable(msg: string) {
  return /email_templates/.test(msg) &&
    (/does not exist/i.test(msg) || /schema cache/i.test(msg) || /could not find/i.test(msg))
}

export async function GET() {
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_templates')
    .select('id, owner_id, name, subject, body, is_html, attachments, scope, created_at')
    .or(`owner_id.eq.${auth.userId},scope.eq.shared`)
    .order('name', { ascending: true })

  if (error) {
    if (missingTable(error.message)) return NextResponse.json({ tableMissing: true, templates: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Flag which templates belong to the caller (only those can be deleted/edited).
  const templates = (data || []).map(t => ({ ...t, mine: t.owner_id === auth.userId }))
  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const { name, subject, body, isHtml, attachments, scope } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Template name is required' }, { status: 400 })

  const attachmentMeta = Array.isArray(attachments)
    ? attachments
        .filter((a: any) => a && typeof a.path === 'string' && typeof a.filename === 'string')
        .map((a: any) => ({ path: a.path, filename: a.filename, contentType: a.contentType, size: a.size }))
    : []

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_templates')
    .insert({
      owner_id: auth.userId,
      name: name.trim(),
      subject: subject?.trim() || null,
      body: typeof body === 'string' ? body : null,
      is_html: isHtml !== false,
      attachments: attachmentMeta.length ? attachmentMeta : null,
      scope: scope === 'shared' ? 'shared' : 'personal',
    })
    .select('id, owner_id, name, subject, body, is_html, attachments, scope, created_at')
    .single()

  if (error) {
    if (missingTable(error.message)) {
      return NextResponse.json(
        { error: 'The email_templates table is missing. Run supabase/pending-migrations.sql in Supabase first.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, template: { ...data, mine: true } })
}
