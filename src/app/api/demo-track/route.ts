import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { mutate, read, requestInfo, isBot, refHost, newId } from '@/lib/demoTracking'
import { isAdminSession } from '@/lib/demoAuth'
import { DEMOS_DIR, isValidSlug } from '@/lib/demos'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Beacon from /demo-beacon.js inside every demo.
//  { slug, ref?, referrer? }            → records an "open", returns { id }
//  { id, dur, pages }                   → updates time-on-page for that open
export async function POST(req: Request) {
  let body: any
  try { body = JSON.parse(await req.text()) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  const info = requestInfo(req)
  if (!rateLimit('demo-track:' + info.vid, 60, 60_000)) return NextResponse.json({ ok: false }, { status: 429 })

  // Update an existing open with duration
  if (typeof body.id === 'string') {
    const dur = Math.max(0, Math.min(6 * 3600, Math.round(Number(body.dur) || 0)))
    const pages = Math.max(1, Math.min(500, Math.round(Number(body.pages) || 1)))
    await mutate(s => {
      const e = s.events.find(x => x.id === body.id && x.vid === info.vid)
      if (e) { e.dur = Math.max(e.dur || 0, dur); e.pages = Math.max(e.pages || 1, pages) }
    })
    return NextResponse.json({ ok: true })
  }

  const slug = String(body.slug || '')
  if (!isValidSlug(slug)) return NextResponse.json({ ok: false }, { status: 400 })
  try { await fs.access(path.join(/*turbopackIgnore: true*/ DEMOS_DIR, slug)) } catch { return NextResponse.json({ ok: false }, { status: 404 }) }

  const store = await read()
  const ref = String(body.ref || '').toLowerCase()
  const code = store.links.some(l => l.code === ref && l.slug === slug) ? ref : undefined
  const bot = isBot(info.ua)
  const admin = await isAdminSession()
  const id = newId()
  await mutate(s => {
    s.events.push({
      id, t: new Date().toISOString(), type: 'open', slug, ...(code ? { code } : {}),
      vid: info.vid, country: info.country, device: info.device, browser: info.browser, os: info.os,
      referrer: refHost(body.referrer), dur: 0, pages: 1,
      ...(bot ? { bot: true } : {}), ...(admin ? { admin: true } : {}),
    })
  })
  return NextResponse.json({ ok: true, id })
}
