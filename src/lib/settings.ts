import { createAdminClient } from '@/lib/supabase/server'
import type { PersonalSender } from '@/lib/email'
import { decryptSecret } from '@/lib/crypto'

// App settings stored in the `app_settings` table (key/value), editable from
// the admin panel. Falls back to environment variables when a key is not set.
// Cached for 30s per server instance to avoid a DB hit on every email.

export type EmailSettings = {
  apiKey: string
  from: string
  adminEmail: string
  notificationFrom: string
}

let cache: { value: Record<string, string>; at: number } | null = null
const TTL_MS = 30_000

export async function getAppSettings(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value
  const value: Record<string, string> = {}
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('app_settings').select('key, value')
    data?.forEach(r => { if (r.value) value[r.key] = r.value })
  } catch (e) {
    console.error('Settings load error:', e)
  }
  cache = { value, at: Date.now() }
  return value
}

export function invalidateSettingsCache() {
  cache = null
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const s = await getAppSettings()
  return {
    apiKey: s.resend_api_key || process.env.RESEND_API_KEY || '',
    from: s.email_from || process.env.EMAIL_FROM || 'AG Development <support@ag-development.dev>',
    adminEmail: s.admin_email || process.env.ADMIN_EMAIL || 'support@ag-development.dev',
    // Shared mailbox From for automated notifications.
    notificationFrom:
      s.notification_from || process.env.NOTIFICATION_FROM ||
      'AG Development <notification@ag-development.dev>',
  }
}

export async function getAdminEmail(): Promise<string> {
  return (await getEmailSettings()).adminEmail
}

// ── Per-admin personal sender ──────────────────────────────────────────────────
// Resolves how an admin's lead replies / composed emails should be sent.
// Reply-To is always the admin's real login inbox so replies come back to them.
//  • Resend mode (a Resend key is configured): the admin must have set a From
//    email on the verified domain (smtp_from_email). No password needed.
//  • SMTP fallback (no Resend key): the admin must have configured their own
//    SMTP host/user/password.
// Returns null when not configured, so callers can prompt the admin to set it up.
// NEVER returns the raw password to the client — server-only.
export async function getAdminSender(userId: string): Promise<PersonalSender | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('email, full_name, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from_name, smtp_from_email')
    .eq('id', userId)
    .single()

  if (!data) return null

  const cfg = await getEmailSettings()
  const replyTo = data.email
  const fromName = data.smtp_from_name || data.full_name || ''
  const mkFrom = (addr: string) => (fromName ? `${fromName} <${addr}>` : addr)

  // Resend mode: send from the admin's verified-domain From address.
  if (cfg.apiKey) {
    if (!data.smtp_from_email) return null
    return { from: mkFrom(data.smtp_from_email), replyTo }
  }

  // SMTP fallback: need the admin's own mailbox credentials.
  if (!data.smtp_host || !data.smtp_user || !data.smtp_pass_enc) return null
  let pass: string
  try {
    pass = decryptSecret(data.smtp_pass_enc)
  } catch {
    return null
  }
  const fromEmail = data.smtp_from_email || data.email
  const from = mkFrom(fromEmail)
  return {
    from,
    replyTo,
    smtp: {
      host: data.smtp_host,
      port: Number(data.smtp_port) || 587,
      secure: data.smtp_secure ?? undefined,
      user: data.smtp_user,
      pass,
      from,
      replyTo,
    },
  }
}
