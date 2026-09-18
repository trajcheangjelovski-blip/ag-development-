import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOutreachAdmin } from '@/lib/outreach'

// GET /api/outreach/campaigns/:id → campaign + per-recipient messages

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params

  const admin = await createAdminClient()
  const [{ data: campaign }, { data: messages }] = await Promise.all([
    admin.from('outreach_campaigns')
      .select('id, name, message, audience, status, total, sent_count, failed_count, error, created_at, sent_at')
      .eq('id', id).single(),
    admin.from('outreach_messages')
      .select('id, phone, company_name, status, error, provider_message_id, created_at, updated_at')
      .eq('campaign_id', id)
      .order('created_at', { ascending: true })
      .limit(5000),
  ])

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ campaign, messages: messages || [] })
}
