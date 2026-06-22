import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCampaign, type CampaignRow } from '@/lib/emailCampaigns'
import { getAdminSender } from '@/lib/settings'

// Delivers any email campaigns whose scheduled time has arrived.
//
// Run this on a short interval (e.g. every 5 minutes) and send CRON_SECRET as a
// Bearer token — same convention as /api/cron/monthly-invoices. Each run grabs
// the campaigns that are 'scheduled' and due, and sends them. sendCampaign flips
// the row to 'sending' first, so overlapping runs won't double-send.

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(request.url).searchParams.get('secret')
  return provided === secret
}

async function run() {
  const admin = await createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: due, error } = await admin
    .from('email_campaigns')
    .select('id, subject, body, is_html, attachments, recipients, status, scheduled_for, sent_count, failed_count, created_by')
    .eq('status', 'scheduled')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(25)

  if (error) return { error: error.message }

  let processed = 0
  let emailsSent = 0
  let emailsFailed = 0
  for (const c of (due || []) as (CampaignRow & { created_by: string | null })[]) {
    // Scheduled emails send under the sending identity of their creator.
    const sender = c.created_by ? await getAdminSender(c.created_by) : null
    if (!sender) {
      await admin.from('email_campaigns').update({
        status: 'failed',
        sent_at: new Date().toISOString(),
        error: 'Sender has no sending identity configured.',
      }).eq('id', c.id)
      processed++
      continue
    }
    const r = await sendCampaign(admin, c, sender)
    processed++
    emailsSent += r.sent
    emailsFailed += r.failed
  }

  return { ok: true, checkedAt: nowIso, campaignsProcessed: processed, emailsSent, emailsFailed }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
