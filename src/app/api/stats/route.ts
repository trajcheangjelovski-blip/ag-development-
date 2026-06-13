import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Support analytics: response times, closure counts + attribution, per client,
// and per admin. Computed live from tickets / ticket_comments / activity_logs
// (messages excluded).

type Cmt = { t: number; role: string; authorId: string | null; authorName: string }
type CloseInfo = { kind: 'admin' | 'client'; actorId?: string | null; actorName?: string }

function diffMins(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000
}
function avg(arr: number[]): number | null {
  return arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()

  const { data: tickets } = await admin
    .from('tickets')
    .select('id, client_id, status, created_at, client:clients(business_name)')
    .neq('category', 'Message')

  const list = tickets || []
  const ids = list.map(t => t.id)

  // Public comments (with author id/name/role), oldest first
  const commentsByTicket: Record<string, Cmt[]> = {}
  if (ids.length) {
    const { data: comments } = await admin
      .from('ticket_comments')
      .select('ticket_id, created_at, author:profiles!author_id(id, full_name, role)')
      .in('ticket_id', ids)
      .eq('comment_type', 'public')
      .order('created_at', { ascending: true })
    for (const c of comments || []) {
      const a = (c as any).author
      ;(commentsByTicket[(c as any).ticket_id] ||= []).push({
        t: new Date((c as any).created_at).getTime(),
        role: a?.role || 'client',
        authorId: a?.id || null,
        authorName: a?.full_name || (a?.role === 'admin' ? 'AG Development' : 'Client'),
      })
    }
  }

  // Who closed each ticket (latest close-type activity wins), with actor for admin
  const closeAttr: Record<string, CloseInfo> = {}
  if (ids.length) {
    const { data: acts } = await admin
      .from('activity_logs')
      .select('ticket_id, action, detail, created_at, actor:profiles!actor_id(id, full_name)')
      .in('ticket_id', ids)
      .order('created_at', { ascending: true })
    for (const a of acts || []) {
      if (a.action === 'Ticket closed') closeAttr[a.ticket_id] = { kind: 'client' }
      else if (a.action === 'Status changed' && /Closed|Completed/i.test(a.detail || '')) {
        closeAttr[a.ticket_id] = { kind: 'admin', actorId: (a as any).actor?.id, actorName: (a as any).actor?.full_name }
      }
    }
  }

  function computeMetrics(subset: typeof list) {
    const firstResponses: number[] = []
    const adminGaps: number[] = []
    const clientGaps: number[] = []
    let open = 0, resolved = 0, closedByAdmin = 0, closedByClient = 0

    for (const t of subset) {
      const cs = commentsByTicket[t.id] || []
      const firstAdmin = cs.find(c => c.role === 'admin')
      if (firstAdmin) firstResponses.push(diffMins(t.created_at, new Date(firstAdmin.t).toISOString()))

      let pendingClient: number | null = null
      let pendingAdmin: number | null = null
      for (const c of cs) {
        if (c.role === 'admin') {
          if (pendingClient != null) { adminGaps.push((c.t - pendingClient) / 60000); pendingClient = null }
          if (pendingAdmin == null) pendingAdmin = c.t
        } else {
          if (pendingAdmin != null) { clientGaps.push((c.t - pendingAdmin) / 60000); pendingAdmin = null }
          if (pendingClient == null) pendingClient = c.t
        }
      }

      if (['Closed', 'Completed'].includes(t.status)) {
        resolved++
        if (closeAttr[t.id]?.kind === 'client') closedByClient++; else closedByAdmin++
      } else {
        open++
      }
    }

    return {
      total: subset.length,
      open,
      resolved,
      closedByAdmin,
      closedByClient,
      respondedCount: firstResponses.length,
      avgFirstResponseMins: avg(firstResponses),
      avgAdminResponseMins: avg(adminGaps),
      avgClientResponseMins: avg(clientGaps),
    }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthList = list.filter(t => new Date(t.created_at).getTime() >= monthStart)

  // Per-client (all-time)
  const byClient: Record<string, typeof list> = {}
  for (const t of list) (byClient[t.client_id] ||= []).push(t)
  const perClient = Object.entries(byClient)
    .map(([clientId, ts]) => ({
      clientId,
      name: (ts[0] as any).client?.business_name || 'Unknown',
      ...computeMetrics(ts),
    }))
    .sort((a, b) => b.total - a.total)

  // Per-admin (all-time) — attribute replies, response speed and closures
  const adminAgg: Record<string, {
    name: string; replies: number; handled: Set<string>; gaps: number[]; firsts: number[]; closed: number
  }> = {}
  const ensure = (id: string, name: string) =>
    (adminAgg[id] ||= { name, replies: 0, handled: new Set(), gaps: [], firsts: [], closed: 0 })

  for (const t of list) {
    const cs = commentsByTicket[t.id] || []
    const firstAdmin = cs.find(c => c.role === 'admin')
    if (firstAdmin?.authorId) {
      ensure(firstAdmin.authorId, firstAdmin.authorName).firsts.push(diffMins(t.created_at, new Date(firstAdmin.t).toISOString()))
    }
    let pendingClient: number | null = null
    for (const c of cs) {
      if (c.role === 'admin') {
        if (c.authorId) {
          const a = ensure(c.authorId, c.authorName)
          a.replies++
          a.handled.add(t.id)
          if (pendingClient != null) { a.gaps.push((c.t - pendingClient) / 60000); pendingClient = null }
        }
      } else if (pendingClient == null) {
        pendingClient = c.t
      }
    }
    if (['Closed', 'Completed'].includes(t.status)) {
      const ca = closeAttr[t.id]
      if (ca?.kind === 'admin' && ca.actorId) ensure(ca.actorId, ca.actorName || 'Admin').closed++
    }
  }

  const perAdmin = Object.entries(adminAgg)
    .map(([id, a]) => ({
      id,
      name: a.name,
      replies: a.replies,
      ticketsHandled: a.handled.size,
      ticketsClosed: a.closed,
      avgFirstResponseMins: avg(a.firsts),
      avgResponseMins: avg(a.gaps),
    }))
    .sort((a, b) => b.replies - a.replies)

  return NextResponse.json({
    overall: computeMetrics(list),
    month: computeMetrics(monthList),
    perClient,
    perAdmin,
    generatedAt: new Date().toISOString(),
  })
}
