import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewLeadNotification } from '@/lib/email'
import { notifyAdmin } from '@/lib/notifications'
import { getAdminEmail } from '@/lib/settings'

// Public endpoint: free website review request with optional logo upload.
// Uses the service-role client (validated, whitelisted fields only).
export async function POST(request: NextRequest) {
  const supabase = await createAdminClient()
  const formData = await request.formData()

  const business_name = (formData.get('business_name') as string || '').trim()
  const website = (formData.get('website') as string || '').trim()
  const full_name = (formData.get('full_name') as string || '').trim()
  const email = (formData.get('email') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const about = (formData.get('about') as string || '').trim()
  const logo = formData.get('logo') as File | null

  if (!business_name || !full_name || !email || !about) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Optional logo upload
  let logoNote = 'Logo: not provided'
  if (logo && logo.size > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(logo.type)) {
      return NextResponse.json({ error: 'Logo must be an image (JPEG, PNG, GIF, WebP, or SVG)' }, { status: 400 })
    }
    if (logo.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Logo too large. Maximum 50MB.' }, { status: 400 })
    }

    const ext = logo.name.split('.').pop() || 'png'
    const safeName = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    const fileName = `lead-logos/${safeName}-${Date.now()}.${ext}`

    let { data: uploaded, error: uploadError } = await supabase.storage
      .from('proof-uploads')
      .upload(fileName, logo, { cacheControl: '3600', upsert: false })

    // Self-heal: create the bucket on first use if it doesn't exist yet
    if (uploadError && /bucket not found/i.test(uploadError.message)) {
      await supabase.storage.createBucket('proof-uploads', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024,
      })
      ;({ data: uploaded, error: uploadError } = await supabase.storage
        .from('proof-uploads')
        .upload(fileName, logo, { cacheControl: '3600', upsert: false }))
    }

    if (uploadError || !uploaded) {
      return NextResponse.json({ error: `Logo upload failed: ${uploadError?.message || 'Unknown error'}` }, { status: 500 })
    }

    const { data: urlData } = await supabase.storage
      .from('proof-uploads')
      .createSignedUrl(uploaded.path, 60 * 60 * 24 * 30) // 30 days

    logoNote = `Logo: ${urlData?.signedUrl || uploaded.path}`
  }

  const message = [
    '— Free Website Review Request —',
    `About the business:\n${about}`,
    logoNote,
  ].join('\n\n')

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      business_name,
      website: website || null,
      full_name,
      email,
      phone: phone || null,
      help_type: 'Free Website Review',
      budget: 'Not specified',
      message,
      status: 'New',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyAdmin({
    title: `New free website review request from ${business_name}`,
    body: `${full_name} (${email})${logo && logo.size > 0 ? ' — logo attached' : ''}`,
    link: `/admin/leads/${lead.id}`,
    type: 'info',
  })

  await sendNewLeadNotification({
    adminEmail: await getAdminEmail(),
    businessName: business_name,
    fullName: full_name,
    leadEmail: email,
    budget: 'Not specified',
    helpType: 'Free Website Review',
  })

  return NextResponse.json(lead, { status: 201 })
}
