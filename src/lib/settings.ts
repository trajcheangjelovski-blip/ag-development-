import { createAdminClient } from '@/lib/supabase/server'

// App settings stored in the `app_settings` table (key/value), editable from
// the admin panel. Falls back to environment variables when a key is not set.
// Cached for 30s per server instance to avoid a DB hit on every email.

export type EmailSettings = {
  apiKey: string
  from: string
  adminEmail: string
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
  }
}

export async function getAdminEmail(): Promise<string> {
  return (await getEmailSettings()).adminEmail
}
