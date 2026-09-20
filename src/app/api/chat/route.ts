import { NextRequest, NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { getPublicPlans } from '@/lib/plans'
import { formatPrice } from '@/lib/money'
import { regionFromLocale } from '@/i18n/routing'

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

// Localized user-facing strings returned by this endpoint.
const STR = {
  en: {
    rateLimited: 'Too many messages — please slow down a little.',
    unavailable: 'The assistant is unavailable right now. Please use "Leave a message" instead.',
    replyFallback: 'Sorry, I had trouble answering that. Could you rephrase?',
    noMessage: 'No message provided',
  },
  mk: {
    rateLimited: 'Премногу пораки — ве молиме забавете малку.',
    unavailable: 'Асистентот моментално не е достапен. Ве молиме користете „Оставете порака“.',
    replyFallback: 'Извинете, имав проблем да одговорам на тоа. Може ли да го преформулирате?',
    noMessage: 'Нема испратена порака',
  },
} as const

type Locale = keyof typeof STR
function pickLocale(v: unknown): Locale {
  return v === 'mk' ? 'mk' : 'en'
}

// Map catalog categories → structured PRICING_DATA groups.
const CATEGORY_KEY: Record<string, string> = {
  'Website Build': 'websites',
  'Website Care': 'maintenance',
  'IT Support': 'itSupport',
  'Social Media': 'socialMedia',
}

// Deterministic, locale-aware price string. The model must quote this verbatim
// and never compute or convert prices itself.
function priceDisplay(amount: number, interval: 'month' | null, locale: Locale): string {
  const money = formatPrice(amount, locale === 'mk' ? 'MKD' : 'USD', locale)
  if (!interval) return money
  return locale === 'mk' ? `${money}/месечно` : `${money}/mo`
}

// Build the canonical, region-aware pricing block injected into every request.
// Reads the SAME source as the rest of the site (getPublicPlans → plans/plans_mk),
// so the assistant can never show a stale, wrong-currency, or invented price.
async function buildPricingData(locale: Locale) {
  const region = regionFromLocale(locale)
  const plans = await getPublicPlans(region)
  const groups: Record<string, Array<Record<string, unknown>>> = {}
  for (const p of plans) {
    const key = CATEGORY_KEY[p.category] || 'other'
    const onSale = p.sale_active && p.effective_price < p.price
    ;(groups[key] ||= []).push({
      id: p.id,
      name: p.name,
      billing: p.billing_interval ? 'monthly' : 'one-time',
      price: priceDisplay(p.effective_price, p.billing_interval, locale),
      ...(onSale ? { regularPrice: priceDisplay(p.price, p.billing_interval, locale) } : {}),
      includes: p.description,
    })
  }
  return groups
}

async function buildSystemPrompt(locale: Locale): Promise<string> {
  const pricingData = await buildPricingData(locale)
  const pricingJson = JSON.stringify(pricingData, null, 2)

  if (locale === 'mk') {
    return `Ти си виртуелен асистент на AG Development за македонската верзија на веб-страницата. AG Development изработува веб-страници, нуди далечинска ИТ поддршка и дигитални услуги за мали и средни бизниси.

ЈАЗИК:
- Секогаш одговарај на стандарден македонски јазик и користи македонско кирилично писмо, дури и ако корисникот пишува на англиски или со латиница — освен ако корисникот јасно го продолжува разговорот на англиски и бара одговор на англиски.
- Пиши природно, професионално и разговорно. Не преведувај буквално од англиски.
- Не користи српски, хрватски или бугарски зборови и конструкции.
- Користи формално обраќање: „вие“, „вашиот“, „вашата“, „вашите“, „можете“, „погледнете“, „контактирајте“. Не користи неформално „ти“ освен ако корисникот експлицитно побара неформално обраќање.
- Користи ги следните термини: веб-страница (не „веб страна“), веб-страници, е-пошта, ИТ поддршка, одржување на веб-страница, резервна копија, резервни копии, мобилни уреди, корекции (за design changes), хостинг, бизнис.

ЦЕНИ (КРИТИЧНО):
- За цени користи ИСКЛУЧИВО податоците од PRICING_DATA подолу. Прикажувај ја цената ТОЧНО како што е дадена во полето "price" (пр. „6.000 мкд“, „1.500 мкд/месечно“).
- НИКОГАШ не измислувај, не претпоставувај и не менувај цена. НИКОГАШ не конвертирај USD/EUR во денари сам. НИКОГАШ не користи цена од општо знаење или меморија.
- Ако цената или пакетот не постои во PRICING_DATA, кажи точно: „Не можам сигурно да ја потврдам цената. Погледнете ја страницата со цени на /pricing или контактирајте нè.“
- Не прикажувај цени во долари ($) на македонската верзија, освен ако корисникот конкретно бара друга валута.

PRICING_DATA:
${pricingJson}

КЛУЧНИ ФАКТИ:
- Бесплатно демо за бизнисот: посетителите ја пополнуваат формата на /review (можат да качат лого и детали за бизнисот) и добиваат прилагодено демо на веб-страница по е-пошта во рок од 24 часа — бесплатно, без обврска.
- Плановите за одржување вклучуваат хостинг. Доменот секогаш се плаќа одделно. Плановите за одржување имаат минимум од 6 месеци.
- Изработка на веб-страници: клиентот доставува лого, текст и слики; испораката започнува откако ќе се добие содржината. Еднократно плаќање, веб-страницата е целосно на клиентот.
- Комбинирани услуги по мерка: /order/custom-plan.
- Може да се нарача и плати онлајн: додадете планови во кошничката и платете безбедно преку Stripe.
- Контакт: trajche.angjelovski@ag-development.dev, телефон 075 498 887, достапност 24/7, далечинска поддршка.
- Корисни линкови: /pricing (сите пакети), /review (бесплатно демо), /order/custom-plan (план по мерка), /contact (контакт), /cart (плаќање).

ПРАВИЛА:
- Биди концизен (обично 2–4 кратки реченици), топол и јасен. Без непотребен жаргон.
- Одговарај само за AG Development, услугите, цените и процесот. За неповрзани теми, љубезно врати се на темата.
- Кога некој покажува интерес, предложи го бесплатното демо на /review како лесен прв чекор.
- Ако сакаат да разговараат со човек, им треба понуда по мерка или имаат проблем што не можеш да го решиш, упати ги да го користат копчето „Оставете порака“ под чатот или да пишат на trajche.angjelovski@ag-development.dev.
- Форматирај ги линковите како обични патеки, пр. /pricing — виџетот ги прави кликабилни.`
  }

  return `You are the friendly assistant on the AG Development website. AG Development provides websites, remote IT support, and digital services for small businesses in the US.

PRICING (CRITICAL):
- For prices use ONLY the PRICING_DATA below. Show the price EXACTLY as given in the "price" field (e.g. "$150", "$29/mo").
- NEVER invent, assume, convert, or change a price. NEVER use a price from general knowledge or memory.
- If a price or package is not in PRICING_DATA, say: "I can't confirm that price for sure. Please check /pricing or contact us."

PRICING_DATA:
${pricingJson}

KEY FACTS:
- Free demo for your business: visitors fill the form at /review (they can upload their logo and business details) and receive a custom website demo by email within 24 hours, free, no commitment.
- Care plans include web hosting. Domain names are always purchased separately (~$10-15/year). Care plans have a 6-month minimum; extra work is $10/hr.
- Website builds: client provides logo, text, and images; delivery starts after content is received. One-time payment, client owns the site.
- Custom mixes of services: /order/custom-plan — we build a plan around their needs and budget.
- Customers can order and pay online: add plans to the cart and pay securely via Stripe.
- Support: support@ag-development.dev, response within 1 business day, Mon-Fri 9am-6pm ET, fully remote across the US.
- Useful links: /pricing (all packages), /review (free business demo), /order/custom-plan (custom plan), /contact (message us), /cart (checkout).

RULES:
- Be concise (2-4 short sentences usually), warm, and plain-spoken. No jargon.
- Answer only about AG Development, its services, prices, and process. For unrelated topics, politely steer back.
- When someone seems interested, suggest the free demo for their business at /review as the easy first step.
- If they want to talk to a person, need a custom quote, or have an issue you can't resolve, tell them to use the "Leave a message" button below the chat or email support@ag-development.dev.
- Format links as plain paths like /pricing — the widget makes them clickable.`
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const body = await request.json()
  const locale = pickLocale(body.locale)
  const str = STR[locale]

  if (rateLimited(ip)) {
    return NextResponse.json({ error: str.rateLimited }, { status: 429 })
  }

  const settings = await getAppSettings()
  const apiKey = settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const incoming = Array.isArray(body.messages) ? body.messages : []
  const messages = incoming
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_CHARS) }))

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: str.noMessage }, { status: 400 })
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
        system: await buildSystemPrompt(locale),
        messages,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Chat API error:', data?.error?.message)
      return NextResponse.json({ error: str.unavailable }, { status: 502 })
    }

    const reply = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim()

    return NextResponse.json({ reply: reply || str.replyFallback })
  } catch (e) {
    console.error('Chat error:', e)
    return NextResponse.json({ error: str.unavailable }, { status: 502 })
  }
}
