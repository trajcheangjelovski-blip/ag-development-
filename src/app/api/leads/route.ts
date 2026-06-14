import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendNewLeadNotification } from '@/lib/email'
import { notifyAdmin } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = new URL(request.url).searchParams.get('status')

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (status && status !== 'All') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`leads:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 })
  }
  // Public lead form: use service-role client so anonymous visitors can submit
  // (input is validated below; only whitelisted fields are inserted)
  const supabase = await createAdminClient()
  const body = await request.json()
  const { business_name, website, full_name, email, phone, help_type, budget, message } = body

  // Validation
  if (!business_name || !full_name || !email || !help_type || !budget) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ business_name, website, full_name, email, phone, help_type, budget, message, status: 'New' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admin: panel notification + email
  await notifyAdmin({
    title: `New request from ${business_name}`,
    body: `${help_type} — Budget: ${budget}`,
    link: `/admin/leads/${lead.id}`,
    type: 'info',
  })

  await sendNewLeadNotification({
    adminEmail: await getAdminEmail(),
    businessName: business_name,
    fullName: full_name,
    leadEmail: email,
    budget,
    helpType: help_type,
  })

  return NextResponse.json(lead, { status: 201 })
}
