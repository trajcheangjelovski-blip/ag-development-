// Tracking for client pitch demos (/demos/<slug>/).
//
// Two kinds of events, stored in one small JSON file on a persistent volume
// (DATA_DIR, a named Docker volume in production — no database migration needed):
//   • click — someone followed a tracked link  ag-development.dev/go/<code>
//             (messenger/marketplace link previews are flagged as `bot`)
//   • open  — a demo page actually loaded in a browser (beacon script in each
//             demo's index.html). Catches untracked links too, e.g. ones sent
//             before tracked links existed. Updated with time-on-page on exit.
// No IP addresses are stored — visitors are a salted hash of IP + user agent.
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const DATA_DIR = process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), '.data')
const FILE = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'demo-tracking.json')
const MAX_EVENTS = 20000

export type DemoLink = { code: string; slug: string; label: string; note: string; createdAt: string; createdBy: string }
export type DemoEvent = {
  id: string
  t: string
  type: 'click' | 'open'
  slug: string
  code?: string
  vid: string
  country: string
  device: string
  browser: string
  os: string
  referrer?: string
  bot?: boolean
  admin?: boolean
  dur?: number   // seconds on the demo (open events)
  pages?: number // in-demo page/section views (open events)
}
type Store = { links: DemoLink[]; events: DemoEvent[] }

// Shared across every route bundle in the process (module instances may not be).
const g = globalThis as unknown as { __agDemoTrack?: { store: Store | null; chain: Promise<unknown> } }
const state = (g.__agDemoTrack ||= { store: null, chain: Promise.resolve() })

async function load(): Promise<Store> {
  if (state.store) return state.store
  try {
    const raw = JSON.parse(await fs.readFile(FILE, 'utf8'))
    state.store = { links: raw.links || [], events: raw.events || [] }
  } catch {
    state.store = { links: [], events: [] }
  }
  return state.store
}

async function persist(s: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = FILE + '.' + process.pid + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(s))
  await fs.rename(tmp, FILE)
}

// Serialise every read-modify-write so concurrent requests never lose events.
export function mutate<T>(fn: (s: Store) => T): Promise<T> {
  const run = state.chain.then(async () => {
    const s = await load()
    const out = fn(s)
    if (s.events.length > MAX_EVENTS) s.events.splice(0, s.events.length - MAX_EVENTS)
    await persist(s)
    return out
  })
  state.chain = run.catch(() => {})
  return run
}

export async function read(): Promise<Store> {
  await state.chain.catch(() => {})
  return load()
}

/* ---------------- request helpers ---------------- */

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|twitter|viber|skype|embedly|quora|pinterest|vkshare|w3c_validator|curl|wget|python|httpclient|okhttp|node-fetch|axios|go-http|java\/|headless|lighthouse|pingdom|uptime|monitor/i

export function isBot(ua: string) {
  return !ua || BOT_RE.test(ua)
}

export function parseUA(ua: string) {
  const device = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : 'Desktop'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other'
  const os = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'Other'
  return { device, browser, os }
}

export function requestInfo(req: Request) {
  const h = req.headers
  const ua = h.get('user-agent') || ''
  const ip = h.get('cf-connecting-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || ''
  const salt = process.env.DEMO_TRACK_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ag-demos'
  const vid = crypto.createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex').slice(0, 12)
  const country = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
  return { ua, vid, country, ...parseUA(ua) }
}

export function newId(len = 10) {
  return crypto.randomBytes(16).toString('base64url').replace(/[-_]/g, '').slice(0, len)
}

// Short, unambiguous link codes (no 0/O/1/l/I).
export function newCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'
  const b = crypto.randomBytes(7)
  return Array.from(b, x => abc[x % abc.length]).join('')
}

export function refHost(ref: string | null | undefined): string {
  if (!ref) return ''
  try {
    const u = new URL(ref)
    if (/(^|\.)ag-development\.dev$/.test(u.hostname)) return ''
    return u.hostname.replace(/^www\./, '').slice(0, 80)
  } catch { return '' }
}

/* ---------------- stats ---------------- */

export type LinkStats = DemoLink & {
  clicks: number      // human clicks on the /go link
  previews: number    // link-preview bot fetches
  opens: number       // demo opens attributed to this link
  visitors: number    // unique human visitors (clicks + opens)
  totalSeconds: number
  lastAt: string | null
}

export function linkStats(store: Store): LinkStats[] {
  return store.links.map(l => {
    const ev = store.events.filter(e => e.code === l.code && !e.admin)
    const human = ev.filter(e => !e.bot)
    const opens = human.filter(e => e.type === 'open')
    const last = human.map(e => e.t).sort().pop() || null
    return {
      ...l,
      clicks: human.filter(e => e.type === 'click').length,
      previews: ev.filter(e => e.bot).length,
      opens: opens.length,
      visitors: new Set(human.map(e => e.vid)).size,
      totalSeconds: opens.reduce((n, e) => n + (e.dur || 0), 0),
      lastAt: last,
    }
  }).sort((a, b) => (b.lastAt || b.createdAt).localeCompare(a.lastAt || a.createdAt))
}

export function demoStats(store: Store) {
  const out: Record<string, { opens: number; opens7d: number; visitors: number; lastAt: string | null }> = {}
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  for (const e of store.events) {
    if (e.type !== 'open' || e.admin || e.bot) continue
    const s = (out[e.slug] ||= { opens: 0, opens7d: 0, visitors: 0, lastAt: null })
    s.opens++
    if (e.t >= weekAgo) s.opens7d++
    if (!s.lastAt || e.t > s.lastAt) s.lastAt = e.t
  }
  for (const slug of Object.keys(out)) {
    out[slug].visitors = new Set(store.events.filter(e => e.slug === slug && e.type === 'open' && !e.admin && !e.bot).map(e => e.vid)).size
  }
  return out
}
