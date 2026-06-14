import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Upload a file/image for the popup chat. Returns a long-lived signed URL that
// the sender embeds in a chat message. Both admins and clients may upload.
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  const clientId = profile.role === 'admin' ? (form.get('client_id') as string) : profile.client_id
  if (!file || file.size === 0) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  if (profile.role !== 'admin' && profile.client_id !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large. Maximum 25MB.' }, { status: 400 })

  const admin = await createAdminClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
  const path = `chat/${clientId}/${Date.now()}-${safeName}`

  await admin.storage.updateBucket('proof-uploads', { public: false, fileSizeLimit: MAX_SIZE }).catch(() => {})
  let { data: up, error } = await admin.storage.from('proof-uploads').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error && /bucket not found/i.test(error.message)) {
    await admin.storage.createBucket('proof-uploads', { public: false, fileSizeLimit: MAX_SIZE })
    ;({ data: up, error } = await admin.storage.from('proof-uploads').upload(path, file, { cacheControl: '3600', upsert: false }))
  }
  if (error || !up) return NextResponse.json({ error: `Upload failed: ${error?.message || 'unknown'}` }, { status: 500 })

  const { data: urlData } = await admin.storage.from('proof-uploads').createSignedUrl(up.path, 60 * 60 * 24 * 365)
  if (!urlData?.signedUrl) return NextResponse.json({ error: 'Could not create file URL' }, { status: 500 })

  return NextResponse.json({ url: urlData.signedUrl, name: file.name, size: file.size })
}
