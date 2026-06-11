import { NextRequest, NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { getPlans, effectivePrice } from '@/lib/plans'

// Public AI chat endpoint for the website widget (Claude API).
// Key comes from admin Settings (anthropic_api_key) or ANTHROPIC_API_KEY env.

const MAX_MESSAGES = 12
const MAX_MESSAGE_CHARS = 1500

// Naive per-IP rate limit (best effort, per server instance)
const hits = new Map<string, { count: number; at: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.at > 60_000) {
    hits.set(ip, { count: 1, at: now })
    return false
  }
  h.count += 1
  return h.count > 20
}

async function buildSystemPrompt(): Promise<string> {
  const { plans } = await getPlans()
  const planLines = plans
    .filter(p => p.is_active)
    .map(p => {
      const price = effectivePrice(p)
      const sale = p.sale_active && p.sale_price != null && p.sale_price < p.price
      return `- ${p.name} (${p.category}): $${price}${p.billing_interval ? '/month' : ' one-time'}${sale ? ` (ON SALE, regular $${p.price})` : ''} — ${p.description}`
    })
    .join('\n')

  return `You are the friendly assistant on the AG Development website. AG Development provides websites, remote IT support, and digital services for small businesses in the US.

CURRENT SERVICES AND PRICES (always use these, never invent others):
${planLines}

KEY FACTS:
- Free website review: visitors fill the form at /review (they can upload their logo and business details) and receive a custom website design by email within 24 hours, free, no commitment.
- Care plans include web hosting. Domain names are always purchased separately (~$10-15/year). Care plans have a 6-month minimum; extra work is $10/hr.
- Website builds: client provides logo, text, and images; delivery starts after content is received. One-time payment, client owns the site.
- Custom mixes of services: /order/custom-plan — we build a plan around their needs and budget.
- Customers can order and pay online: add plans to the cart and pay securely via Stripe.
- Support: support@ag-development.dev, response within 1 business day, Mon-Fri 9am-6pm ET, fully remote across the US.
- Useful links: /pricing (all packages), /review (free website design), /order/custom-plan (custom plan), /contact (message us), /cart (checkout).

RULES:
- Be concise (2-4 short sentences usually), warm, and plain-spoken. No jargon.
- Answer only about AG Development, its services, prices, and process. For unrelated topics, politely steer back.
- Never invent prices, discounts, or features. If unsure, say so and point to /contact.
- When someone seems interested, suggest the free website review at /review as the easy first step.
- If they want to talk to a person, need a custom quote, or have an issue you can't resolve, tell them to use the "Leave a message" button below the chat or email support@ag-development.dev.
- Format links as plain paths like /pricing — the widget makes them clickable.`
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages — please slow down a little.' }, { status: 429 })
  }

  const settings = await getAppSettings()
  const apiKey = settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const body = await request.json()
  const incoming = Array.isArray(body.messages) ? body.messages : []
  const messages = incoming
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_CHARS) }))

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'No message provided' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: await buildSystemPrompt(),
        messages,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Chat API error:', data?.error?.message)
      return NextResponse.json({ error: 'The assistant is unavailable right now. Please use "Leave a message" instead.' }, { status: 502 })
    }

    const reply = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim()

    return NextResponse.json({ reply: reply || 'Sorry, I had trouble answering that. Could you rephrase?' })
  } catch (e) {
    console.error('Chat error:', e)
    return NextResponse.json({ error: 'The assistant is unavailable right now. Please use "Leave a message" instead.' }, { status: 502 })
  }
}
