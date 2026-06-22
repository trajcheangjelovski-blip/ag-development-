import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encryptSecret } from '@/lib/crypto'
import { getAdminSender, getEmailSettings } from '@/lib/settings'
import { sendConnectionTest } from '@/lib/email'

// Per-admin personal email connection used for lead replies and composed emails.
// Each admin manages their OWN connection here; the stored password is encrypted
// and never returned to the browser.

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('email, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from_name, smtp_from_email')
    .eq('id', user.id)
    .single()

  if (error) {
    if (/smtp_host/.test(error.message) && (/does not exist/i.test(error.message) || /schema cache/i.test(error.message) || /could not find/i.test(error.message))) {
      return NextResponse.json({ tableMissing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // When Resend is the active transport, admins only need a verified-domain From
  // address — no SMTP host/user/password.
  const usingResend = !!(await getEmailSettings()).apiKey

  return NextResponse.json({
    usingResend,
    host: data?.smtp_host || '',
    port: data?.smtp_port || 587,
    secure: data?.smtp_secure ?? false,
    user: data?.smtp_user || '',
    fromName: data?.smtp_from_name || '',
    fromEmail: data?.smtp_from_email || data?.email || '',
    passwordSet: !!data?.smtp_pass_enc,
    configured: usingResend
      ? !!data?.smtp_from_email
      : !!(data?.smtp_host && data?.smtp_user && data?.smtp_pass_enc),
  })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.host === 'string') updates.smtp_host = body.host.trim() || null
  if (body.port !== undefined && body.port !== '') updates.smtp_port = Number(body.port) || 587
  if (typeof body.secure === 'boolean') updates.smtp_secure = body.secure
  if (typeof body.user === 'string') updates.smtp_user = body.user.trim() || null
  if (typeof body.fromName === 'string') updates.smtp_from_name = body.fromName.trim() || null
  if (typeof body.fromEmail === 'string') updates.smtp_from_email = body.fromEmail.trim() || null
  // Only touch the password when a non-empty value is sent (so saving other
  // fields doesn't wipe it). An explicit empty string clears it.
  if (typeof body.password === 'string') {
    updates.smtp_pass_enc = body.password.trim() ? encryptSecret(body.password.trim()) : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', user.id)
  if (error) {
    if (/smtp_host|smtp_pass_enc/.test(error.message)) {
      return NextResponse.json(
        { error: 'Email connection columns are missing. Run supabase/pending-migrations.sql in Supabase first.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// Send a test email using the admin's saved sending identity.
export async function POST() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sender = await getAdminSender(user.id)
  if (!sender) {
    return NextResponse.json({ error: 'Save your sending details first.' }, { status: 400 })
  }
  try {
    await sendConnectionTest(sender)
    return NextResponse.json({ ok: true, to: sender.replyTo })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Test failed' }, { status: 502 })
  }
}
