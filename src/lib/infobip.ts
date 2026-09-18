// Infobip Viber Business Messages client.
//
// Uses Infobip's unified Messages API:  POST {baseUrl}/messages-api/1/messages
// with channel "VIBER_BM". Auth is the account API key sent as `Authorization:
// App <API_KEY>`. Each Infobip account has its own base URL (shown in the
// Infobip portal, e.g. "https://xxxxx.api.infobip.com").
//
// Env:
//   INFOBIP_BASE_URL      e.g. https://xxxxx.api.infobip.com   (no trailing slash)
//   INFOBIP_API_KEY       your API key
//   INFOBIP_VIBER_SENDER  approved Viber sender (brand name / registered sender)
//   INFOBIP_MESSAGES_PATH optional override of the endpoint path
//                         (default: /messages-api/1/messages)
//
// NOTE: The exact request/response shape is also shown, pre-filled for your
// account, in the Infobip portal under the API tab. If your account is on the
// older channel-specific endpoint (/viber/2/messages), set INFOBIP_MESSAGES_PATH
// and adjust `buildBody` accordingly — the rest of the app is unaffected.

export type ViberSendResult = {
  ok: boolean
  messageId?: string
  status?: string
  error?: string
}

export function infobipConfigured(): boolean {
  return Boolean(process.env.INFOBIP_BASE_URL && process.env.INFOBIP_API_KEY && process.env.INFOBIP_VIBER_SENDER)
}

function baseUrl(): string {
  return (process.env.INFOBIP_BASE_URL || '').replace(/\/+$/, '')
}

function messagesUrl(): string {
  const path = process.env.INFOBIP_MESSAGES_PATH || '/messages-api/1/messages'
  return baseUrl() + path
}

// Build the unified Messages API body for one Viber text message, with optional
// automatic SMS failover when the recipient has no Viber.
function buildBody(to: string, text: string, smsFailoverText?: string) {
  const sender = process.env.INFOBIP_VIBER_SENDER!
  const message: Record<string, unknown> = {
    channel: 'VIBER_BM',
    sender,
    destinations: [{ to }],
    content: { body: { type: 'TEXT', text } },
  }
  if (smsFailoverText) {
    // Infobip failover: delivered as SMS if the Viber message can't be sent.
    message.smsFailover = { sender, text: smsFailoverText }
  }
  return { messages: [message] }
}

// Pull a message id + status out of Infobip's response, tolerant of the small
// shape differences between API versions.
function parseResponse(json: any): { messageId?: string; status?: string } {
  const m = json?.messages?.[0] ?? json
  const messageId = m?.messageId || m?.id || json?.bulkId
  const status =
    m?.status?.name || m?.status?.groupName || m?.status?.group || m?.status || undefined
  return { messageId, status: typeof status === 'string' ? status : undefined }
}

// Send a single Viber text message. Never throws — returns {ok:false, error}.
export async function sendViber(to: string, text: string, smsFailoverText?: string): Promise<ViberSendResult> {
  if (!infobipConfigured()) {
    return { ok: false, error: 'Infobip is not configured (set INFOBIP_BASE_URL, INFOBIP_API_KEY, INFOBIP_VIBER_SENDER).' }
  }
  try {
    const res = await fetch(messagesUrl(), {
      method: 'POST',
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(buildBody(to, text, smsFailoverText)),
      cache: 'no-store',
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const msg =
        json?.requestError?.serviceException?.text ||
        json?.messages?.[0]?.status?.description ||
        `Infobip HTTP ${res.status}`
      return { ok: false, error: msg }
    }
    const { messageId, status } = parseResponse(json)
    return { ok: true, messageId, status }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error calling Infobip' }
  }
}

// Map an Infobip delivery-report/status group to our internal status.
export function mapInfobipStatus(groupOrName: string): 'sent' | 'delivered' | 'seen' | 'failed' | null {
  const s = (groupOrName || '').toUpperCase()
  if (s.includes('SEEN')) return 'seen'
  if (s.includes('DELIVERED')) return 'delivered'
  if (s.includes('PENDING') || s.includes('ACCEPTED') || s.includes('SENT')) return 'sent'
  if (s.includes('UNDELIVERABLE') || s.includes('REJECTED') || s.includes('EXPIRED') || s.includes('FAIL')) return 'failed'
  return null
}
