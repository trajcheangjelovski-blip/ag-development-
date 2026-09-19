import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOutreachAdmin, isOutreachTableMissing, renderMessage } from '@/lib/outreach'
import { sendViber, infobipConfigured } from '@/lib/infobip'

type Recipient = { id: string; company_name: string | null; phone: string }

// GET  /api/outreach/campaigns   → list campaigns
// POST /api/outreach/campaigns   → create a campaign and send it now
//   body: { name, message, audience: 'consented'|'all_not_opted_out', smsFailover?: boolean }

const SEND_DELAY_MS = 60      // ~16 msg/s throttle, gentle on Infobip rate limits
const MAX_RECIPIENTS = 10000  // safety cap per campaign

export async function GET() {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('outreach_campaigns')
    .select('id, name, message, audience, status, total, sent_count, failed_count, error, created_at, sent_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (isOutreachTableMissing(error.message)) return NextResponse.json({ tableMissing: true, campaigns: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error

  if (!infobipConfigured()) {
    return NextResponse.json({ error: 'Infobip is not configured on the server yet. Add INFOBIP_BASE_URL, INFOBIP_API_KEY and INFOBIP_VIBER_SENDER.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as {
    name?: string; message?: string; audience?: string; smsFailover?: boolean
  }
  const name = (body.name || '').trim()
  const message = (body.message || '').trim()
  const audience = body.audience === 'all_not_opted_out' ? 'all_not_opted_out' : 'consented'
  if (!name || !message) return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })

  const admin = await createAdminClient()

  // Resolve audience → recipients (always exclude opted-out).
  let q = admin
    .from('outreach_contacts')
    .select('id, company_name, phone')
    .eq('opted_out', false)
    .limit(MAX_RECIPIENTS)
  if (audience === 'consented') q = q.eq('consent_status', 'granted')

  const { data: recipients, error: recErr } = await q
  if (recErr) {
    if (isOutreachTableMissing(recErr.message)) return NextResponse.json({ tableMissing: true }, { status: 400 })
    return NextResponse.json({ error: recErr.message }, { status: 500 })
  }
  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients match this audience (check consent / opt-out).' }, { status: 400 })
  }

  // Create the campaign row up front.
  const { data: campaign, error: campErr } = await admin
    .from('outreach_campaigns')
    .insert({ name, message, audience, status: 'sending', total: recipients.length })
    .select('id')
    .single()
  if (campErr || !campaign) return NextResponse.json({ error: campErr?.message || 'Could not create campaign' }, { status: 500 })

  const campaignId = campaign.id as string

  // Send in the background so the request returns immediately — a large list can
  // take minutes (recipients × SEND_DELAY_MS) and would otherwise time out the
  // request / block the UI. `after` keeps the loop running on the standalone
  // Node server after the response is sent; the UI polls campaign status.
  after(() => runCampaign(campaignId, recipients, message, Boolean(body.smsFailover)))

  return NextResponse.json({ id: campaignId, total: recipients.length, queued: true })
}

// Send one campaign to all recipients, logging each message and keeping the
// campaign row's counts/status current. Never throws — on an unexpected error it
// marks the campaign failed so the UI stops showing "sending" forever.
async function runCampaign(campaignId: string, recipients: Recipient[], message: string, smsFailover: boolean) {
  const admin = await createAdminClient()
  let sent = 0, failed = 0
  try {
    for (const r of recipients) {
      const text = renderMessage(message, r.company_name)
      const smsText = smsFailover ? text : undefined
      const result = await sendViber(r.phone, text, smsText)

      await admin.from('outreach_messages').insert({
        campaign_id: campaignId,
        contact_id: r.id,
        phone: r.phone,
        company_name: r.company_name,
        body: text,
        provider_message_id: result.messageId || null,
        status: result.ok ? 'sent' : 'failed',
        error: result.ok ? null : (result.error || 'Send failed'),
      })

      if (result.ok) sent++; else failed++
      // Keep the campaign counts live so the polling UI shows progress.
      await admin.from('outreach_campaigns')
        .update({ sent_count: sent, failed_count: failed })
        .eq('id', campaignId)

      if (SEND_DELAY_MS) await new Promise(res => setTimeout(res, SEND_DELAY_MS))
    }

    await admin.from('outreach_campaigns').update({
      status: failed === recipients.length ? 'failed' : 'sent',
      sent_count: sent,
      failed_count: failed,
      sent_at: new Date().toISOString(),
      error: failed === recipients.length ? 'All messages failed — check Infobip credentials/sender.' : null,
    }).eq('id', campaignId)
  } catch (e) {
    await admin.from('outreach_campaigns').update({
      status: 'failed',
      sent_count: sent,
      failed_count: failed,
      sent_at: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'Campaign send crashed',
    }).eq('id', campaignId)
  }
}
