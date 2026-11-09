import { NextResponse } from 'next/server'
import { mutate } from '@/lib/demoTracking'
import { demoViewer } from '@/lib/demoAuth'

export const dynamic = 'force-dynamic'

// DELETE /api/demo-links/<code> → removes the tracked link (its history is kept
// in the event log but no longer grouped; the /go link stops working).
export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const v = await demoViewer()
  if (!v.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!v.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { code } = await params
  const removed = await mutate(s => {
    const n = s.links.length
    s.links = s.links.filter(l => l.code !== code)
    return n !== s.links.length
  })
  return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Link not found' }, { status: 404 })
}
