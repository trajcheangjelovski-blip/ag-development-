import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const ticketId = formData.get('ticket_id') as string
  const imageType = formData.get('type') as 'before' | 'after' // before or after

  if (!file || !ticketId) {
    return NextResponse.json({ error: 'file and ticket_id required' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only images are allowed (JPEG, PNG, GIF, WebP)' }, { status: 400 })
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${ticketId}/${imageType}-${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('proof-uploads')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get signed URL (private bucket)
  const { data: urlData } = await supabase.storage
    .from('proof-uploads')
    .createSignedUrl(data.path, 60 * 60 * 24 * 7) // 7 days

  return NextResponse.json({
    path: data.path,
    url: urlData?.signedUrl,
  })
}
