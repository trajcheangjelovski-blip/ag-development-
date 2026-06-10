import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, ProgressBar } from '@/components/ui'
import { formatMinutes, currentBillingMonth, formatMonth } from '@/lib/utils'

export default async function ClientUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const clientId = profile.client_id
  const month = currentBillingMonth()

  const { data: client } = await supabase.from('clients').select('*, package:support_packages(*)').eq('id', clientId).single()
  const pkg = (client as any)?.package

  // Current month
  const { data: currentEntries } = await supabase.from('time_entries').select('minutes').eq('client_id', clientId).eq('billing_month', month)
  const { data: currentTickets } = await supabase.from('tickets').select('id').eq('client_id', clientId).like('created_at', `${month}%`)

  const usedMinutes = currentEntries?.reduce((s, e) => s + e.minutes, 0) || 0
  const usedRequests = currentTickets?.length || 0
  const includedHours = pkg?.hours_per_month || 0
  const includedRequests = pkg?.requests_per_month || 0
  const extraMinutes = Math.max(0, usedMinutes - includedHours * 60)

  // Past months
  const { data: allEntries } = await supabase.from('time_entries').select('billing_month, minutes').eq('client_id', clientId)
  const monthMap: Record<string, number> = {}
  allEntries?.forEach(e => { monthMap[e.billing_month] = (monthMap[e.billing_month] || 0) + e.minutes })

  const { data: allTickets } = await supabase.from('tickets').select('created_at').eq('client_id', clientId)
  const ticketMonthMap: Record<string, number> = {}
  allTickets?.forEach(t => {
    const m = t.created_at.slice(0, 7)
    ticketMonthMap[m] = (ticketMonthMap[m] || 0) + 1
  })

  const allMonths = [...new Set([...Object.keys(monthMap), ...Object.keys(ticketMonthMap)])].sort().reverse()

  return (
    <PortalLayout>
      <div className="p-8">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">Plan Usage</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Current Plan" value={pkg?.name || '—'} sub={pkg ? `$${pkg.price}/month` : ''} accent />
          <StatCard label="Requests Used" value={`${usedRequests}/${includedRequests}`} sub={`${Math.max(0, includedRequests - usedRequests)} remaining`} />
          <StatCard label="Hours Used" value={`${(usedMinutes / 60).toFixed(1)}h`} sub={`of ${includedHours}h included`} />
          <StatCard label="Extra Hours" value={`${(extraMinutes / 60).toFixed(1)}h`} sub={extraMinutes > 0 ? `Billed at $${pkg?.extra_hourly_rate}/hr` : 'None this month'} />
        </div>

        {/* Current month */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-slate-800 mb-5">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} — Current Month
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <ProgressBar used={usedRequests} total={includedRequests} label="Support Requests" />
            <ProgressBar used={parseFloat((usedMinutes / 60).toFixed(1))} total={includedHours} label="Support Hours" />
          </div>
          {extraMinutes > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              ⚠️ {formatMinutes(extraMinutes)} over your included hours this month — billed at ${pkg?.extra_hourly_rate}/hr
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center text-sm">
            <div><div className="text-slate-400 text-xs mb-1">Included Requests</div><div className="font-bold text-slate-800">{includedRequests}/month</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Included Hours</div><div className="font-bold text-slate-800">{includedHours}h/month</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Extra Rate</div><div className="font-bold text-slate-800">${pkg?.extra_hourly_rate}/hr</div></div>
          </div>
        </div>

        {/* History */}
        {allMonths.filter(m => m !== month).length > 0 && (
          <div>
            <h2 className="font-display font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Usage History</h2>
            <div className="space-y-3">
              {allMonths.filter(m => m !== month).map(m => {
                const mins = monthMap[m] || 0
                const reqs = ticketMonthMap[m] || 0
                const extra = Math.max(0, mins - includedHours * 60)
                return (
                  <div key={m} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-slate-800">{formatMonth(m)}</h3>
                      <div className="flex gap-4 text-sm">
                        <span><strong>{reqs}</strong>/{includedRequests} requests</span>
                        <span><strong>{(mins/60).toFixed(1)}h</strong>/{includedHours}h</span>
                        {extra > 0 && <span className="text-red-600 font-semibold">+{formatMinutes(extra)} extra</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ProgressBar used={reqs} total={includedRequests} label="Requests" />
                      <ProgressBar used={parseFloat((mins/60).toFixed(1))} total={includedHours} label="Hours" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
