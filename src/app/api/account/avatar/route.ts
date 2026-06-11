import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Upload (POST) or remove (DELETE) the logged-in user's profile picture/logo.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Please upload an image (PNG, JPG, WebP, or SVG)' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large. Maximum 5MB.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const ext = file.name.split('.').pop() || 'png'
  const path = `avatars/${user.id}-${Date.now()}.${ext}`

  let { data: uploaded, error: uploadError } = await admin.storage
    .from('proof-uploads')
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    await admin.storage.createBucket('proof-uploads', { public: false, fileSizeLimit: 50 * 1024 * 1024 })
    ;({ data: uploaded, error: uploadError } = await admin.storage
      .from('proof-uploads')
      .upload(path, file, { cacheControl: '3600', upsert: true }))
  }
  if (uploadError || !uploaded) {
    return NextResponse.json({ error: `Upload failed: ${uploadError?.message || 'Unknown error'}` }, { status: 500 })
  }

  // 1-year signed URL (private bucket); refreshed whenever the avatar changes
  const { data: urlData, error: urlError } = await admin.storage
    .from('proof-uploads')
    .createSignedUrl(uploaded.path, 60 * 60 * 24 * 365)

  if (urlError || !urlData?.signedUrl) {
    return NextResponse.json({ error: 'Could not create image URL' }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: urlData.signedUrl })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ avatar_url: urlData.signedUrl })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { error } = await admin.from('profiles').update({ avatar_url: null }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
