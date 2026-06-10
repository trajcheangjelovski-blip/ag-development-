import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, StatusBadge, PriorityBadge } from '@/components/ui'
import { formatDate, formatMinutes } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const [
    { data: clients },
    { data: tickets },
    { data: leads },
    { data: invoices },
    { data: activity },
  ] = await Promise.all([
    supabase.from('clients').select('id, is_active'),
    supabase.from('tickets').select('*, client:clients(business_name)').order('created_at', { ascending: false }).limit(50),
    supabase.from('leads').select('id, status'),
    supabase.from('invoices').select('id, status, amount'),
    supabase.from('activity_logs').select('*, actor:profiles(full_name), client:clients(business_name)').order('created_at', { ascending: false }).limit(10),
  ])

  const activeClients = clients?.filter(c => c.is_active).length || 0
  const openTickets = tickets?.filter(t => t.status === 'Open').length || 0
  const urgentTickets = tickets?.filter(t => t.priority === 'Urgent' && !['Completed','Closed'].includes(t.status)).length || 0
  const newLeads = leads?.filter(l => l.status === 'New').length || 0
  const pendingInvoices = invoices?.filter(i => i.status === 'Pending' || i.status === 'Overdue') || []
  const pendingAmount = pendingInvoices.reduce((s, i) => s + i.amount, 0)
  const activeTickets = tickets?.filter(t => !['Completed','Closed'].includes(t.status)).slice(0, 6) || []

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of all clients, tickets, and business activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Active Clients" value={activeClients} sub="On monthly plans" accent />
          <StatCard label="Open Tickets" value={openTickets} sub="Need attention" />
          <StatCard label="Urgent Tickets" value={urgentTickets} sub="High priority" />
          <StatCard label="New Leads" value={newLeads} sub="Awaiting contact" />
          <StatCard label="Pending Invoices" value={`$${pendingAmount}`} sub={`${pendingInvoices.length} invoices`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tickets */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-800">Active Tickets</h2>
              <Link href="/admin/tickets" className="text-xs text-blue-600 hover:underline font-medium">View All →</Link>
            </div>
            <div>
              {activeTickets.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No active tickets 🎉</div>
              ) : activeTickets.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{t.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.client?.business_name} · {t.category}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <Link href="/admin/tickets/new" className="btn-secondary text-xs px-3 py-2">
                + New Ticket
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-slate-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activity?.map((a: any) => (
                <div key={a.id} className="px-5 py-3 flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700">{a.action}</div>
                    <div className="text-xs text-slate-500 truncate">{a.client?.business_name}</div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
