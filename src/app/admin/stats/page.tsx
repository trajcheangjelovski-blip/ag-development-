'use client'
import { useEffect, useState } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'

type Metrics = {
  total: number
  open: number
  resolved: number
  closedByAdmin: number
  closedByClient: number
  respondedCount: number
  avgFirstResponseMins: number | null
  avgAdminResponseMins: number | null
  avgClientResponseMins: number | null
}
type PerClient = Metrics & { clientId: string; name: string }
type PerAdmin = {
  id: string; name: string; replies: number; ticketsHandled: number; ticketsClosed: number
  avgFirstResponseMins: number | null; avgResponseMins: number | null
}
type Stats = { overall: Metrics; month: Metrics; perClient: PerClient[]; perAdmin: PerAdmin[]; generatedAt: string }

function dur(m: number | null): string {
  if (m == null) return '—'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const mm = Math.round(m % 60)
  return mm ? `${h}h ${mm}m` : `${h}h`
}

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</div>
      <div className="font-display text-2xl font-extrabold text-slate-800">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}

function MetricCards({ m }: { m: Metrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Total Tickets" value={m.total} />
      <Card label="Open" value={m.open} hint="Not yet resolved" />
      <Card label="Resolved" value={m.resolved} hint={`${m.closedByAdmin} by admin · ${m.closedByClient} by client`} />
      <Card label="Closed by Client" value={m.closedByClient} />
      <Card label="Avg First Response" value={dur(m.avgFirstResponseMins)} hint={`${m.respondedCount} tickets answered`} />
      <Card label="Avg Admin Response" value={dur(m.avgAdminResponseMins)} hint="Client → your reply" />
      <Card label="Avg Client Response" value={dur(m.avgClientResponseMins)} hint="Your reply → client" />
      <Card label="Closed by Admin" value={m.closedByAdmin} />
    </div>
  )
}

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/stats')
      if (res.ok) setStats(await res.json())
      else setError((await res.json().catch(() => ({})))?.error || 'Failed to load statistics')
      setLoading(false)
    })()
  }, [])

  function exportCsv() {
    if (!stats) return
    const cols = ['total', 'open', 'resolved', 'closedByAdmin', 'closedByClient', 'avgFirstResponseMins', 'avgAdminResponseMins', 'avgClientResponseMins'] as const
    const header = ['Scope', 'Total', 'Open', 'Resolved', 'Closed by admin', 'Closed by client', 'Avg first response (min)', 'Avg admin response (min)', 'Avg client response (min)']
    const row = (scope: string, m: Metrics) => [scope, ...cols.map(c => m[c] ?? '')].join(',')
    const adminHeader = ['Admin', 'Replies', 'Tickets handled', 'Tickets closed', 'Avg first response (min)', 'Avg response (min)']
    const lines = [
      header.join(','),
      row('All-time', stats.overall),
      row('This month', stats.month),
      ...stats.perClient.map(p => row(p.name.replace(/,/g, ' '), p)),
      '',
      adminHeader.join(','),
      ...stats.perAdmin.map(a => [
        a.name.replace(/,/g, ' '), a.replies, a.ticketsHandled, a.ticketsClosed,
        a.avgFirstResponseMins ?? '', a.avgResponseMins ?? '',
      ].join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `support-stats-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800">Support Statistics</h1>
            <p className="text-slate-500 text-sm mt-1">Response times and ticket outcomes across your support desk.</p>
          </div>
          <button onClick={exportCsv} disabled={!stats} className="btn-secondary text-sm disabled:opacity-50">⬇ Export CSV</button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading statistics…</div>
        ) : error ? (
          <div className="card p-6 text-sm text-red-600">{error}</div>
        ) : stats ? (
          <div className="space-y-8">
            <section>
              <h2 className="font-display font-bold text-slate-800 mb-3">All-time</h2>
              <MetricCards m={stats.overall} />
            </section>

            <section>
              <h2 className="font-display font-bold text-slate-800 mb-3">This Month</h2>
              <MetricCards m={stats.month} />
            </section>

            <section>
              <h2 className="font-display font-bold text-slate-800 mb-3">By Admin</h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-th">Admin</th>
                        <th className="table-th text-right">Replies</th>
                        <th className="table-th text-right">Tickets Handled</th>
                        <th className="table-th text-right">Tickets Closed</th>
                        <th className="table-th text-right">Avg 1st Resp</th>
                        <th className="table-th text-right">Avg Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.perAdmin.length === 0 ? (
                        <tr><td className="table-td text-slate-400 text-center" colSpan={6}>No admin replies yet.</td></tr>
                      ) : stats.perAdmin.map(a => (
                        <tr key={a.id} className="border-t border-slate-100">
                          <td className="table-td font-semibold text-slate-800">{a.name}</td>
                          <td className="table-td text-right">{a.replies}</td>
                          <td className="table-td text-right">{a.ticketsHandled}</td>
                          <td className="table-td text-right">{a.ticketsClosed}</td>
                          <td className="table-td text-right">{dur(a.avgFirstResponseMins)}</td>
                          <td className="table-td text-right">{dur(a.avgResponseMins)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display font-bold text-slate-800 mb-3">By Client</h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-th">Client</th>
                        <th className="table-th text-right">Total</th>
                        <th className="table-th text-right">Open</th>
                        <th className="table-th text-right">Resolved</th>
                        <th className="table-th text-right">Closed A / C</th>
                        <th className="table-th text-right">Avg 1st Resp</th>
                        <th className="table-th text-right">Avg Admin</th>
                        <th className="table-th text-right">Avg Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.perClient.length === 0 ? (
                        <tr><td className="table-td text-slate-400 text-center" colSpan={8}>No tickets yet.</td></tr>
                      ) : stats.perClient.map(p => (
                        <tr key={p.clientId} className="border-t border-slate-100">
                          <td className="table-td font-semibold text-slate-800">{p.name}</td>
                          <td className="table-td text-right">{p.total}</td>
                          <td className="table-td text-right">{p.open}</td>
                          <td className="table-td text-right">{p.resolved}</td>
                          <td className="table-td text-right text-slate-500">{p.closedByAdmin} / {p.closedByClient}</td>
                          <td className="table-td text-right">{dur(p.avgFirstResponseMins)}</td>
                          <td className="table-td text-right">{dur(p.avgAdminResponseMins)}</td>
                          <td className="table-td text-right">{dur(p.avgClientResponseMins)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <p className="text-xs text-slate-400">
              Times are averages. “Avg Admin” = how fast you reply after a client; “Avg Client” = how long clients take to reply after you. Messages are excluded.
            </p>
          </div>
        ) : null}
      </div>
    </PortalLayout>
  )
}
