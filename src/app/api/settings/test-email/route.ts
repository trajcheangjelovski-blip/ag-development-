import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotificationTest } from '@/lib/email'
import { getEmailSettings } from '@/lib/settings'

// Sends a test email through the shared NOTIFICATION mailbox to the configured
// admin address, so the admin can verify the notification SMTP config works.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cfg = await getEmailSettings()
  try {
    await sendNotificationTest(cfg.adminEmail)
    return NextResponse.json({ ok: true, to: cfg.adminEmail })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Test email failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
