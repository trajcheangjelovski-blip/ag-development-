import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_SIZE = 200 * 1024 * 1024 // 200MB

// Upload a file/screenshot attachment to a ticket.
// Clients may attach to their own tickets; admins to any ticket.
// Returns a long-lived signed URL that gets embedded in a comment.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, client_id').eq('id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: ticket } = await admin.from('tickets').select('id, client_id').eq('id', id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (profile.role !== 'admin' && ticket.client_id !== profile.client_id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 200MB.' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
  const path = `attachments/${id}/${Date.now()}-${safeName}`

  // Make sure the bucket exists and allows large files
  await admin.storage.updateBucket('proof-uploads', { public: false, fileSizeLimit: MAX_SIZE }).catch(() => {})

  let { data: uploaded, error: uploadError } = await admin.storage
    .from('proof-uploads')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    await admin.storage.createBucket('proof-uploads', { public: false, fileSizeLimit: MAX_SIZE })
    ;({ data: uploaded, error: uploadError } = await admin.storage
      .from('proof-uploads')
      .upload(path, file, { cacheControl: '3600', upsert: false }))
  }
  if (uploadError || !uploaded) {
    return NextResponse.json({ error: `Upload failed: ${uploadError?.message || 'Unknown error'}` }, { status: 500 })
  }

  const { data: urlData, error: urlError } = await admin.storage
    .from('proof-uploads')
    .createSignedUrl(uploaded.path, 60 * 60 * 24 * 365)

  if (urlError || !urlData?.signedUrl) {
    return NextResponse.json({ error: 'Could not create file URL' }, { status: 500 })
  }

  return NextResponse.json({
    url: urlData.signedUrl,
    name: file.name,
    size: file.size,
  })
}
