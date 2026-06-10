import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, StatusBadge, PriorityBadge, ProgressBar, EmptyState } from '@/components/ui'
import { PayInvoiceButton } from '@/components/portal/PayInvoiceButton'
import { formatDate, formatMinutes, formatRelativeTime, currentBillingMonth } from '@/lib/utils'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const clientId = profile.client_id
  const month = currentBillingMonth()

  const [
    { data: client },
    { data: openTickets },
    { data: recentTickets },
    { data: monthEntries },
    { data: monthTickets },
    { data: activity },
    { data: allTickets },
    { data: unpaidInvoices },
  ] = await Promise.all([
    supabase.from('clients').select('*, package:support_packages(*)').eq('id', clientId).single(),
    supabase.from('tickets').select('id').eq('client_id', clientId).not('status', 'in', '("Completed","Closed")'),
    supabase.from('tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
    supabase.from('time_entries').select('minutes').eq('client_id', clientId).eq('billing_month', month),
    supabase.from('tickets').select('id').eq('client_id', clientId).like('created_at', `${month}%`),
    supabase.from('activity_logs').select('*, actor:profiles(full_name)').eq('client_id', clientId).order('created_at', { ascending: false }).limit(8),
    supabase.from('tickets').select('id').eq('client_id', clientId),
    supabase.from('invoices').select('*').eq('client_id', clientId).in('status', ['Pending', 'Overdue']).order('due_date', { ascending: true }),
  ])

  const allTicketIds = allTickets?.map((t: any) => t.id) || []
  let recentMessages: any[] = []
  if (allTicketIds.length > 0) {
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('id, body, created_at, ticket_id, author:profiles(id, full_name, role), ticket:tickets(id, title)')
      .in('ticket_id', allTicketIds)
      .eq('comment_type', 'public')
      .order('created_at', { ascending: false })
      .limit(20)
    recentMessages = (comments || []).filter((c: any) => c.author?.role === 'admin').slice(0, 3)
  }

  const pkg = (client as any)?.package
  const dueInvoices = unpaidInvoices || []
  const totalDue = dueInvoices.reduce((s: number, i: any) => s + i.amount, 0)
  const today = new Date().toISOString().slice(0, 10)
  const hasOverdue = dueInvoices.some(
    (i: any) => i.status === 'Overdue' || (i.due_date && i.due_date < today)
  )
  const usedMinutes = monthEntries?.reduce((s, e) => s + e.minutes, 0) || 0
  const usedRequests = monthTickets?.length || 0
  const includedHours = pkg?.hours_per_month || 0
  const includedRequests = pkg?.requests_per_month || 0

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-xl font-extrabold text-slate-800">
            Welcome back, {profile.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">{(client as any)?.business_name} · {pkg?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Your Plan" value={pkg?.name || '—'} sub={pkg ? `$${pkg.price}/month` : ''} accent />
          <StatCard label="Open Tickets" value={openTickets?.length || 0} sub="Active requests" />
          <StatCard label="Hours Used" value={`${(usedMinutes/60).toFixed(1)}h`} sub={`of ${includedHours}h included`} />
          <StatCard label="Requests Used" value={usedRequests} sub={`of ${includedRequests} included`} />
        </div>

        {/* Balance due */}
        {dueInvoices.length > 0 && (
          <div
            className="card p-5 mb-6 flex flex-wrap items-center gap-4"
            style={hasOverdue
              ? { borderColor: '#fecaca', background: '#fef2f2' }
              : { borderColor: '#bfdbfe', background: '#eff6ff' }}
          >
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: hasOverdue ? '#b91c1c' : '#1d4ed8' }}>
                {hasOverdue ? '⚠️ Payment Overdue' : 'Balance Due'}
              </div>
              <div className="font-display text-2xl font-extrabold" style={{ color: hasOverdue ? '#991b1b' : '#0f1f3d' }}>
                ${totalDue}
                <span className="text-sm font-medium text-slate-500 ml-2">
                  {dueInvoices.length === 1
                    ? `${dueInvoices[0].description} (${dueInvoices[0].billing_month})`
                    : `${dueInvoices.length} unpaid invoices`}
                </span>
              </div>
              {dueInvoices[0]?.due_date && (
                <div className="text-xs text-slate-500 mt-0.5">Due {formatDate(dueInvoices[0].due_date)}</div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {dueInvoices.length === 1 ? (
                <PayInvoiceButton invoiceId={dueInvoices[0].id} />
              ) : (
                <Link
                  href="/portal/invoices"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white whitespace-nowrap"
                  style={{ background: '#2563eb' }}
                >
                  💳 View & Pay →
                </Link>
              )}
              <Link href="/portal/invoices" className="text-xs text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap">
                All invoices →
              </Link>
            </div>
          </div>
        )}

        {/* Usage */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-slate-800 mb-4">
            This Month's Usage — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressBar used={usedRequests} total={includedRequests} label="Support Requests" />
            <ProgressBar used={parseFloat((usedMinutes/60).toFixed(1))} total={includedHours} label="Support Hours" />
          </div>
          {usedMinutes > includedHours * 60 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              ⚠️ {formatMinutes(usedMinutes - includedHours * 60)} over included hours — billed at ${pkg?.extra_hourly_rate}/hr
            </div>
          )}
          <div className="mt-4 text-xs text-slate-400">
            Plan: {includedRequests} requests/mo · {includedHours}h/mo · Response within {pkg?.response_time} · Extra at ${pkg?.extra_hourly_rate}/hr
          </div>
        </div>

        {/* Recent Messages from Us */}
        {recentMessages.length > 0 && (
          <div className="card overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-blue-100 bg-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <h2 className="font-display font-bold text-blue-900">Recent Messages from Us</h2>
              </div>
              <Link href="/portal/tickets" className="text-xs text-blue-600 font-medium hover:underline">View All Tickets →</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentMessages.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/portal/tickets/${c.ticket_id}`}
                  className="flex gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0 mt-0.5">
                    AG
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-slate-500 font-semibold">
                        {c.author?.full_name || 'AG Development'} on{' '}
                        <span className="text-slate-700">{c.ticket?.title}</span>
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                      {c.body}
                    </p>
                  </div>
                  <div className="text-slate-300 group-hover:text-slate-500 transition-colors self-center flex-shrink-0 text-sm">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tickets */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-800">Recent Tickets</h2>
              <Link href="/portal/tickets" className="text-xs text-blue-600 font-medium hover:underline">View All →</Link>
            </div>
            {!recentTickets?.length ? (
              <EmptyState icon="✅" title="No tickets yet" description="Submit a support request whenever you need help." />
            ) : (
              <div>
                {recentTickets.map((t: any) => (
                  <Link key={t.id} href={`/portal/tickets/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{t.title}</div>
                      <div className="text-xs text-slate-400">{t.category} · {formatDate(t.created_at)}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-slate-100">
              <Link href="/portal/tickets/new" className="btn-secondary text-xs px-3 py-2">+ New Request</Link>
            </div>
          </div>

          {/* Activity */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-slate-800">Recent Activity</h2>
            </div>
            {!activity?.length ? (
              <EmptyState title="No activity yet" description="Activity will appear here as tickets are created and updated." />
            ) : (
              <div className="divide-y divide-slate-100">
                {activity.map((a: any) => (
                  <div key={a.id} className="px-5 py-3 flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700">{a.action}</div>
                      <div className="text-xs text-slate-400 truncate">{a.detail}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
