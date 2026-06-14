import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewLeadNotification } from '@/lib/email'
import { notifyAdmin } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// Public contact form: stores the message as a lead, notifies admins in the
// panel, and emails support.
export async function POST(request: NextRequest) {
  if (!rateLimit(`contact:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 })
  }
  const supabase = await createAdminClient()
  const body = await request.json()
  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const message = (body.message || '').trim()
  const service = (body.service || '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const helpType = service ? `Contact: ${service}` : 'Contact Message'

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      business_name: name,
      full_name: name,
      email,
      help_type: helpType,
      budget: 'Not specified',
      message,
      status: 'New',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyAdmin({
    title: `New contact message from ${name}`,
    body: message.length > 120 ? `${message.slice(0, 120)}…` : message,
    link: `/admin/leads/${lead.id}`,
    type: 'info',
  })

  await sendNewLeadNotification({
    adminEmail: await getAdminEmail(),
    businessName: name,
    fullName: name,
    leadEmail: email,
    budget: 'Not specified',
    helpType,
  })

  return NextResponse.json(lead, { status: 201 })
}
