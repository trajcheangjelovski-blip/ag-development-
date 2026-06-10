import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLeadEmail } from '@/lib/email'

// Send a composed email to a lead from the admin panel.
// On success, a lead still in "New" automatically moves to "Contacted",
// and the send is logged in the admin notes.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subject, message } = await request.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', params.id).single()
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  try {
    await sendLeadEmail({ to: lead.email, subject: subject.trim(), message: message.trim() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Email failed to send'
    return NextResponse.json({ error: `Email failed: ${msg}` }, { status: 502 })
  }

  // Log the send + auto-advance New → Contacted
  const stamp = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  const logLine = `[${stamp}] Email sent: "${subject.trim()}"`
  const updates: Record<string, string> = {
    admin_notes: lead.admin_notes ? `${lead.admin_notes}\n${logLine}` : logLine,
  }
  if (lead.status === 'New') updates.status = 'Contacted'

  const { data: updated, error: updateError } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(updated)
}
