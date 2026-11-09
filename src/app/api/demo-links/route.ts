import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { read, mutate, linkStats, demoStats, newCode } from '@/lib/demoTracking'
import { demoViewer } from '@/lib/demoAuth'
import { DEMOS_DIR, isValidSlug } from '@/lib/demos'

export const dynamic = 'force-dynamic'

// GET /api/demo-links → tracked links with stats, per-demo opens and recent activity
export async function GET() {
  const v = await demoViewer()
  if (!v.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!v.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const store = await read()
  const labels = Object.fromEntries(store.links.map(l => [l.code, l.label]))
  const recent = store.events
    .filter(e => !e.admin)
    .slice(-300)
    .reverse()
    .map(e => ({ ...e, label: e.code ? labels[e.code] || null : null }))
  return NextResponse.json({
    links: linkStats(store),
    demos: demoStats(store),
    recent,
    ownVisits: store.events.filter(e => e.admin).length,
  })
}

// POST /api/demo-links { slug, label, note? } → creates a tracked link
export async function POST(req: Request) {
  const v = await demoViewer()
  if (!v.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!v.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const slug = String(body.slug || '')
  const label = String(body.label || '').trim().slice(0, 120)
  const note = String(body.note || '').trim().slice(0, 300)
  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Pick a demo.' }, { status: 400 })
  if (!label) return NextResponse.json({ error: 'Give the link a name (client or project).' }, { status: 400 })
  try { await fs.access(path.join(/*turbopackIgnore: true*/ DEMOS_DIR, slug)) } catch { return NextResponse.json({ error: 'That demo does not exist.' }, { status: 404 }) }

  const link = await mutate(s => {
    let code = newCode()
    while (s.links.some(l => l.code === code)) code = newCode()
    const l = { code, slug, label, note, createdAt: new Date().toISOString(), createdBy: (v.profile as any)?.full_name || (v.profile as any)?.email || 'admin' }
    s.links.push(l)
    return l
  })
  return NextResponse.json({ link })
}
