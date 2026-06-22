import { sendComposedEmail, type PersonalSender, type EmailAttachment } from '@/lib/email'

// Attachment metadata stored on a campaign/template. The actual bytes live in
// the email-attachments Storage bucket at `path`.
export type AttachmentMeta = { path: string; filename: string; contentType?: string; size?: number }

export const ATTACHMENTS_BUCKET = 'email-attachments'

// Download each stored attachment and base64-encode it for the mailer. Skips any
// file that can't be fetched (logged via the thrown send error if all fail).
export async function loadAttachments(admin: AdminClient, metas: AttachmentMeta[] | null | undefined): Promise<EmailAttachment[]> {
  if (!metas || metas.length === 0) return []
  const out: EmailAttachment[] = []
  for (const m of metas) {
    const { data, error } = await admin.storage.from(ATTACHMENTS_BUCKET).download(m.path)
    if (error || !data) continue
    const buf = Buffer.from(await data.arrayBuffer())
    out.push({ filename: m.filename, content: buf.toString('base64'), contentType: m.contentType })
  }
  return out
}

// Loose-but-practical email check. Good enough to catch typos/empties before we
// hand a list to the mailer; the SMTP server is the real authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Turn a textarea blob (commas, semicolons, spaces, or newlines) into a clean,
// de-duplicated list of valid addresses, plus whatever we rejected.
export function parseRecipients(input: unknown): { valid: string[]; invalid: string[] } {
  const raw = Array.isArray(input)
    ? input.map(String)
    : String(input ?? '').split(/[\s,;]+/)

  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const piece of raw) {
    const e = piece.trim().toLowerCase()
    if (!e) continue
    if (seen.has(e)) continue
    seen.add(e)
    if (EMAIL_RE.test(e)) valid.push(e)
    else invalid.push(e)
  }
  return { valid, invalid }
}

export type CampaignRow = {
  id: string
  subject: string
  body: string
  is_html?: boolean
  attachments?: AttachmentMeta[] | null
  recipients: string[]
  status: string
  scheduled_for: string | null
  sent_count: number
  failed_count: number
}

type AdminClient = {
  from: (table: string) => any
  storage: { from: (bucket: string) => any }
}

// Send one campaign to every recipient, recording a per-address result and a
// summary tally. Sends are sequential to stay gentle on the SMTP mailbox.
// `admin` is a Supabase service-role client. Marks the row 'sending' first so a
// concurrent cron run won't pick it up again. `connection` is the sending
// admin's personal sender; all recipients receive mail from that identity.
export async function sendCampaign(admin: AdminClient, campaign: CampaignRow, sender: PersonalSender) {
  await admin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id)

  const recipients = Array.isArray(campaign.recipients) ? campaign.recipients : []
  const results: { email: string; ok: boolean; error?: string }[] = []
  let sent = 0
  let failed = 0

  // Fetch attachments once and reuse for every recipient.
  const attachments = await loadAttachments(admin, campaign.attachments)
  // Body is HTML (rich editor) or plain text depending on how it was composed.
  const bodyArgs = campaign.is_html ? { html: campaign.body } : { message: campaign.body }

  for (const to of recipients) {
    try {
      await sendComposedEmail({ to, subject: campaign.subject, ...bodyArgs, attachments, sender })
      results.push({ email: to, ok: true })
      sent++
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Send failed'
      results.push({ email: to, ok: false, error })
      failed++
    }
  }

  const status = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'sent'
  const topError =
    sent === 0 && failed > 0 ? results.find(r => !r.ok)?.error || 'All sends failed' : null

  await admin
    .from('email_campaigns')
    .update({
      status,
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
      results,
      error: topError,
    })
    .eq('id', campaign.id)

  return { sent, failed, total: recipients.length, status, error: topError }
}
