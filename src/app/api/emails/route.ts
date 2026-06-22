import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'
import { parseRecipients, sendCampaign } from '@/lib/emailCampaigns'
import { getAdminSender } from '@/lib/settings'

// A missing email_campaigns table can be reported by PostgREST ("Could not find
// the table ... in the schema cache") or Postgres ("relation ... does not exist").
function isMissingTable(message: string): boolean {
  return /email_campaigns/.test(message) &&
    (/does not exist/i.test(message) || /schema cache/i.test(message) || /could not find the table/i.test(message))
}

// Admin email broadcasts: list past/scheduled campaigns (GET) and create a new
// one that either sends immediately or is scheduled for later (POST).

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
  return { userId: user.id }
}

export async function GET() {
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('email_campaigns')
    .select('id, subject, body, recipients, status, scheduled_for, sent_at, total, sent_count, failed_count, error, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    // Surface a friendly hint if the migration hasn't been run yet. Supabase
    // (PostgREST) reports a missing table as "Could not find the table
    // 'public.email_campaigns' in the schema cache", while Postgres uses
    // "does not exist" — match either.
    if (isMissingTable(error.message)) {
      return NextResponse.json({ tableMissing: true, campaigns: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireEmailAdmin()
  if (auth.error) return auth.error

  const { subject, message, html, attachments, recipients, scheduledFor } = await request.json()

  // Body is either rich HTML (from the editor) or plain text.
  const isHtml = typeof html === 'string' && html.trim() !== ''
  const body = isHtml ? html : (message || '')
  // Strip tags to check the HTML actually has content (not just empty markup).
  const bodyHasContent = isHtml ? html.replace(/<[^>]*>/g, '').trim() !== '' : body.trim() !== ''

  if (!subject?.trim() || !bodyHasContent) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  // Normalize attachment metadata (path/filename live in Storage).
  const attachmentMeta = Array.isArray(attachments)
    ? attachments
        .filter((a: any) => a && typeof a.path === 'string' && typeof a.filename === 'string')
        .map((a: any) => ({ path: a.path, filename: a.filename, contentType: a.contentType, size: a.size }))
    : []

  const { valid, invalid } = parseRecipients(recipients)
  if (valid.length === 0) {
    return NextResponse.json(
      { error: invalid.length ? `No valid email addresses. Check: ${invalid.join(', ')}` : 'At least one recipient is required' },
      { status: 400 },
    )
  }

  // Validate the schedule time if provided. A time in the past just sends now.
  let scheduledIso: string | null = null
  if (scheduledFor) {
    const when = new Date(scheduledFor)
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: 'Invalid schedule date/time' }, { status: 400 })
    }
    if (when.getTime() > Date.now() + 30_000) scheduledIso = when.toISOString()
  }

  // Composed/bulk emails send under the admin's OWN sending identity. Require it
  // up front so a scheduled send doesn't silently fail later in the cron.
  const sender = await getAdminSender(auth.userId)
  if (!sender) {
    return NextResponse.json(
      { error: 'Set up your sending identity in Account Settings before sending.' },
      { status: 400 },
    )
  }

  const admin = await createAdminClient()
  const { data: campaign, error: insertError } = await admin
    .from('email_campaigns')
    .insert({
      subject: subject.trim(),
      body: isHtml ? body : body.trim(),
      is_html: isHtml,
      attachments: attachmentMeta.length ? attachmentMeta : null,
      recipients: valid,
      total: valid.length,
      status: 'scheduled',
      scheduled_for: scheduledIso,
      created_by: auth.userId,
    })
    .select('id, subject, body, is_html, attachments, recipients, status, scheduled_for, sent_count, failed_count')
    .single()

  if (insertError) {
    if (isMissingTable(insertError.message)) {
      return NextResponse.json(
        { error: 'The email_campaigns table is missing. Run supabase/pending-migrations.sql in your Supabase SQL editor first.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Scheduled for the future — leave it for the cron to pick up.
  if (scheduledIso) {
    return NextResponse.json({
      ok: true,
      scheduled: true,
      campaign,
      recipientsAccepted: valid.length,
      recipientsRejected: invalid,
    })
  }

  // Send right now.
  const result = await sendCampaign(admin, campaign as any, sender)
  return NextResponse.json({
    ok: true,
    scheduled: false,
    campaignId: campaign.id,
    ...result,
    recipientsRejected: invalid,
  })
}
