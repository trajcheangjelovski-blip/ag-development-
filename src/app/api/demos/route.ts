import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'
import { listDemos, githubConfigured } from '@/lib/demos'

export const dynamic = 'force-dynamic'

// GET /api/demos → every client pitch demo currently live on the server
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, admin_role, permissions').eq('id', user.id).single()
  if (!can(profile as any, 'demos.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({
    demos: await listDemos(),
    canDelete: can(profile as any, 'demos.delete'),
    githubConfigured: githubConfigured(),
  })
}
