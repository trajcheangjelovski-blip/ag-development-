import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { mapInfobipStatus } from '@/lib/infobip'
import { normalizePhone } from '@/lib/phone'

// Infobip webhook — configure this URL in the Infobip portal for BOTH:
//   • Delivery reports (message status)         → updates outreach_messages
//   • Inbound Viber messages (replies)          → STOP keyword opts the sender out
//
// Guard with a shared token:  POST /api/outreach/webhook?token=INFOBIP_WEBHOOK_TOKEN
// (Infobip lets you add query params / auth to the callback URL.)

export const dynamic = 'force-dynamic'

const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'стоп', 'отпиши', 'откажи']

// True when the reply is an opt-out. Matches whole words only, so "nonstop" or
// "stopwatch" don't trigger an unsubscribe — only a standalone STOP/СТОП etc.
function isOptOutReply(text: string): boolean {
  const tokens = (text || '').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)
  return tokens.some(t => OPT_OUT_KEYWORDS.includes(t))
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.INFOBIP_WEBHOOK_TOKEN
  if (!expected) return true // not configured → don't block (dev)
  const token = request.nextUrl.searchParams.get('token')
  const header = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return token === expected || header === expected
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await request.json().catch(() => null) as any
  const results: any[] = payload?.results || (Array.isArray(payload) ? payload : [])
  if (!results.length) return NextResponse.json({ ok: true, processed: 0 })

  const admin = await createAdminClient()
  let processed = 0

  for (const r of results) {
    // ── Inbound reply (MO) → opt-out on STOP-style keyword ──
    const inboundText: string | undefined =
      r?.message?.text || r?.text || r?.content?.text || r?.message?.body?.text
    const fromRaw: string | undefined = r?.from || r?.sender || r?.destination
    if (inboundText && fromRaw) {
      if (isOptOutReply(inboundText)) {
        const phone = normalizePhone(fromRaw)
        if (phone) {
          await admin.from('outreach_contacts')
            .update({ opted_out: true, opted_out_at: new Date().toISOString() })
            .eq('phone', phone)
        }
      }
      processed++
      continue
    }

    // ── Delivery report → update message status by provider messageId ──
    const messageId: string | undefined = r?.messageId || r?.message?.id
    const statusStr: string =
      r?.status?.name || r?.status?.groupName || r?.status?.group || r?.error?.name || ''
    if (messageId) {
      const mapped = mapInfobipStatus(statusStr)
      if (mapped) {
        const patch: Record<string, unknown> = { status: mapped, updated_at: new Date().toISOString() }
        if (mapped === 'failed') patch.error = r?.error?.description || r?.status?.description || statusStr || 'Undeliverable'
        await admin.from('outreach_messages').update(patch).eq('provider_message_id', messageId)
      }
      processed++
    }
  }

  return NextResponse.json({ ok: true, processed })
}
