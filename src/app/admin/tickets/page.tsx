'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatusBadge, PriorityBadge, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminTickets() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('All')
  const [clientId, setClientId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('tickets')
      .select('*, client:clients(id, business_name)')
      .neq('category', 'Message') // messages live in the dedicated Messages inbox
      .order('created_at', { ascending: false })
    if (status !== 'All') query = query.eq('status', status)
    if (clientId) query = query.eq('client_id', clientId)
    const { data: tData } = await query
    setTickets(tData || [])
    const { data: cData } = await supabase
      .from('clients')
      .select('id, business_name')
      .order('business_name')
    setClients(cData || [])
    setLoading(false)
  }, [status, clientId])

  useEffect(() => { load() }, [load])

  // Always point to the latest load without re-subscribing on filter change
  const loadRef = useRef(load)
  loadRef.current = load

  // Realtime — auto-refresh when any ticket is created or updated
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        loadRef.current()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // subscribe once, loadRef always has latest

  const statuses = ['All', 'Open', 'In Progress', 'Waiting Client', 'Completed', 'Closed']

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">All Tickets</h1>
          <Link href="/admin/tickets/new" className="btn btn-secondary">+ New Ticket</Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
          <select
            className="ml-2 form-input w-auto py-1.5 text-xs"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading tickets…</div>
          ) : !tickets.length ? (
            <EmptyState icon="🎫" title="No tickets found" description="Try changing the filters above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Client</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Created</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/tickets/${t.id}`)}
                    >
                      <td className="table-td font-semibold text-slate-800 max-w-xs truncate">{t.title}</td>
                      <td className="table-td text-slate-500">{t.client?.business_name}</td>
                      <td className="table-td text-slate-500">{t.category}</td>
                      <td className="table-td"><PriorityBadge priority={t.priority} /></td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                      <td className="table-td text-slate-400">{formatDate(t.created_at)}</td>
                      <td className="table-td">
                        <Link
                          href={`/admin/tickets/${t.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
