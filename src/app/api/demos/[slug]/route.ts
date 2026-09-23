import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'
import { deleteDemo, githubConfigured, isValidSlug } from '@/lib/demos'

// DELETE /api/demos/:slug → remove the demo from git, the server and the Cloudflare cache
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, admin_role, permissions, full_name').eq('id', user.id).single()
  if (!can(profile as any, 'demos.delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Invalid demo name' }, { status: 400 })
  if (!githubConfigured()) {
    return NextResponse.json({
      error: 'GitHub is not configured on the server (GITHUB_TOKEN, GITHUB_REPO). Without it the demo would come back on the next deploy, so nothing was deleted.',
    }, { status: 400 })
  }

  try {
    const result = await deleteDemo(slug, profile?.full_name || user.email || user.id)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
