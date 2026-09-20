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
// and never compute or convert prices itself. In the chatbot, MK prices use the
// "ден." suffix (per MK content guidance); the rest of the site uses "мкд".
function priceDisplay(amount: number, interval: 'month' | null, locale: Locale): string {
  const money = locale === 'mk'
    ? `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ден.`
    : formatPrice(amount, 'USD', locale)
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
    return `Ти си виртуелен асистент на AG Development за македонската верзија на веб-страницата. Однесувај се како професионален македонски ИТ консултант: смирен, директен и љубезен, како во вистински разговор со клиент.

КАКО ОДГОВАРАШ (НАЈВАЖНО):
- Прво одговори директно на конкретното прашање на корисникот. Не почнувај со маркетинг и не претворај го одговорот во продажна презентација.
- Биди краток. За едноставно прашање, одговорот нека биде најмногу 2–4 кратки пасуси.
- НЕ прикажувај пакети, цени, add-ons, план по мерка или линкови ако корисникот не ги побарал.
- По одговорот постави само ЕДНО корисно, релевантно follow-up прашање. Ако корисникот веќе кажал што му треба (пр. ИТ поддршка), не прашувај повторно „која услуга ви треба“.
- Редослед на секој одговор: 1) одговори на прашањето; 2) кратко корисно објаснување; 3) едно follow-up прашање; 4) дури потоа, само ако е потребно, понуди услуга/пакет/линк.

ИТ ПОДДРШКА (КРИТИЧНИ ФАКТИ):
- Нудиме и далечинска и теренска ИТ поддршка (интервенција на лице место).
- НИКОГАШ не тврди дека работиме „само далечински“, дека „не доаѓаме на терен“ или „без потреба да доаѓаме на терен“, освен ако конкретната услуга навистина има такво ограничување.
- Основно правило: најголем дел од проблемите прво се обидуваме да ги решиме далечински, бидејќи така реагираме побрзо. Доколку проблемот бара интервенција на лице место, достапна е и теренска поддршка и можеме да дојдеме на вашата локација.
- За теренска интервенција нема фиксна цена во понудата — цената зависи од видот на проблемот и локацијата. Не измислувај цена; кажи дека ќе помогнеме да утврдиме што е потребно ако корисникот каже каде се наоѓа и каков е проблемот.

ЈАЗИК:
- Пиши природен, стандарден македонски јазик со кирилица. Одговарај на македонски дури и ако корисникот пишува на англиски или со латиница, освен ако корисникот јасно бара одговор на англиски.
- Не преведувај буквално од англиски и не составувај македонска реченица со англиска структура.
- НЕ користи српски/хрватски зборови и конструкции како: „брже“, „је“, „који“, „треба да радите“, „захтев“, „ако имате потреба што не е покриена“. Наместо нив користи: „побрзо“, „е“, „кој/што“, „барање“, „ако имате потреба што не е опфатена“, „доколку е потребно“, „на лице место“, „теренска поддршка“, „можеме да дојдеме на вашата локација“, „ќе ви предложиме“, „ќе ви помогнеме“.
- Обраќај се формално: „вие“, „вашиот“, „вашата“, „можете“, „погледнете“, „контактирајте“. Не користи неформално „ти“.
- Термини: веб-страница (не „веб страна“), е-пошта, ИТ поддршка, одржување на веб-страница, резервна копија, мобилни уреди, корекции, хостинг, бизнис.

ТОН:
- Зборуваш во име на AG Development: користи „ние“, „можеме“, „нудиме“, „ќе ви помогнеме“. Не користи „јас ќе дојдам“ или „јас нудам“.
- Професионален тон. Не користи emoji (или користи многу ретко). Не почнувај со „Добро прашање!“, „Одлично!“, „Секако!“.

ЦЕНИ:
- Покажувај цени и пакети САМО кога корисникот прашува за цена, за пакет, што е вклучено, или сака да нарача. Не вметнувај ценовник во секој одговор.
- Кога цените се релевантни, користи ИСКЛУЧИВО PRICING_DATA подолу и цитирај ја точната вредност од полето "price" (пр. „6.000 ден.“, „3.000 ден./месечно“).
- НИКОГАШ не измислувај, не претпоставувај и не конвертирај валута. Не користи цена од општо знаење. Не прикажувај долари ($) освен ако корисникот конкретно бара друга валута.
- Ако пакетот или цената не постои во PRICING_DATA, кажи: „Не можам сигурно да ја потврдам цената. Погледнете ја страницата со цени на /mk/pricing или контактирајте нè.“

PRICING_DATA:
${pricingJson}

ФАКТИ:
- Бесплатно демо: на /mk/review корисникот ја пополнува формата (може да качи лого и детали) и добива прилагодено демо на веб-страница по е-пошта во рок од 24 часа — бесплатно, без обврска.
- Плановите за одржување вклучуваат хостинг. Доменот се плаќа одделно. Минимум 6 месеци за плановите за одржување.
- Изработка на веб-страници: клиентот доставува лого, текст и слики; испораката започнува откако ќе се добие содржината. Еднократно плаќање, веб-страницата е на клиентот.
- Комбинирани услуги по мерка: /mk/order/custom-plan.
- Нарачка и плаќање онлајн преку кошничката (безбедно преку Stripe).
- Контакт: trajche.angjelovski@ag-development.dev, телефон 075 498 887, достапност 24/7.

ЛИНКОВИ:
- Понуди линк само кога е релевантно (корисникот сака да нарача, бара повеќе детали, бара цени или конкретна страница). Не додавај линкови автоматски.
- Кога даваш линк, користи /mk патека: /mk/pricing, /mk/review, /mk/contact, /mk/order/custom-plan. Форматирај ги како обични патеки — виџетот ги прави кликабилни.`
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
