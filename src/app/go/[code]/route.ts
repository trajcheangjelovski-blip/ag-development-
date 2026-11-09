import { NextResponse } from 'next/server'
import { read, mutate, requestInfo, isBot, refHost, newId } from '@/lib/demoTracking'
import { isAdminSession } from '@/lib/demoAuth'

export const dynamic = 'force-dynamic'

// GET /go/<code> → logs the click, then redirects to the demo.
// The demo's beacon picks up ?ref=<code> so the open is tied to this link too.
async function handle(req: Request, params: Promise<{ code: string }>, head: boolean) {
  const { code } = await params
  const store = await read()
  const link = store.links.find(l => l.code === String(code).toLowerCase())
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '')
  if (!link) return NextResponse.redirect(`${base}/portfolio`, 302)

  const info = requestInfo(req)
  const bot = head || isBot(info.ua)
  const admin = bot ? false : await isAdminSession()
  await mutate(s => {
    s.events.push({
      id: newId(), t: new Date().toISOString(), type: 'click', slug: link.slug, code: link.code,
      vid: info.vid, country: info.country, device: info.device, browser: info.browser, os: info.os,
      referrer: refHost(req.headers.get('referer')), ...(bot ? { bot: true } : {}), ...(admin ? { admin: true } : {}),
    })
  })

  const res = NextResponse.redirect(`${base}/demos/${link.slug}/?ref=${link.code}`, 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Robots-Tag', 'noindex')
  return res
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(req, params, false)
}
export async function HEAD(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(req, params, true)
}
