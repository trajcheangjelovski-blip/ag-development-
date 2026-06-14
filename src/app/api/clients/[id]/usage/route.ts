import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientPlanState } from '@/lib/planUsage'

// The single source of truth for a client's plan usage (period, used vs included
// hours/requests, with capacity top-ups already folded in). Used by BOTH the
// client dashboard and the admin client page so the numbers always match.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.client_id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const state = await getClientPlanState(id)
  return NextResponse.json(state)
}
