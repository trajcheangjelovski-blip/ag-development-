import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeadEmail } from '@/lib/email'
import { getEmailSettings } from '@/lib/settings'

// Sends a test email to the configured admin address so the admin can verify
// the Resend API key, sender domain, and recipient are working.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cfg = await getEmailSettings()
  try {
    await sendLeadEmail({
      to: cfg.adminEmail,
      subject: 'Test email from AG Development admin panel',
      message: `This is a test email sent from your admin panel settings.\n\nSender: ${cfg.from}\nRecipient: ${cfg.adminEmail}\n\nIf you're reading this, your email configuration works.`,
    })
    return NextResponse.json({ ok: true, to: cfg.adminEmail })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Test email failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
