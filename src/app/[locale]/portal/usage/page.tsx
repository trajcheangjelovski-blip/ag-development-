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

  // Capacity top-ups stacked on the base plan (credit blocks)
  const { data: extrasData } = await supabase
    .from('client_extras')
    .select('id, name, qty_total, qty_used, unit')
    .eq('client_id', clientId)
    .order('created_at')
  const topupHours = (extrasData || [])
    .filter(x => x.unit === 'hours')
    .reduce((s, x) => s + Math.max(0, x.qty_total - x.qty_used), 0)
  const topupRequests = (extrasData || [])
    .filter(x => x.unit === 'tickets')
    .reduce((s, x) => s + Math.max(0, x.qty_total - x.qty_used), 0)

  const usedMinutes = currentEntries?.reduce((s, e) => s + e.minutes, 0) || 0
  const usedRequests = currentTickets?.length || 0
  const baseHours = pkg?.hours_per_month || 0
  const baseRequests = pkg?.requests_per_month || 0
  const includedHours = baseHours + topupHours
  const includedRequests = baseRequests + topupRequests
  const extraMinutes = Math.max(0, usedMinutes - includedHours * 60)

  // Everything the plan includes (from the description + terms) — mirrors the dashboard
  const planBenefits: string[] = []
  if (pkg?.description) {
    for (const line of String(pkg.description).split('\n')) {
      const includes = line.match(/^Includes:\s*(.+)$/i)
      if (includes) planBenefits.push(...includes[1].split(/,\s*/).filter(Boolean))
      else if (line.trim()) planBenefits.push(line.trim())
    }
  }
  const planTerms: string[] = pkg ? [
    includedRequests > 0 ? `${includedRequests} support requests per month` : '',
    includedHours > 0 ? `${includedHours}h of support work per month` : '',
    pkg.response_time ? `First response: ${pkg.response_time.toLowerCase().startsWith('within') ? pkg.response_time.toLowerCase() : pkg.response_time}` : '',
    pkg.extra_hourly_rate ? `Extra work beyond included hours at $${pkg.extra_hourly_rate}/hr` : '',
  ].filter(Boolean) : []

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
            <div>
              <div className="text-slate-400 text-xs mb-1">Included Requests</div>
              <div className="font-bold text-slate-800">{includedRequests}/month</div>
              {topupRequests > 0 && <div className="text-[11px] text-blue-600">{baseRequests} base + {topupRequests} top-up</div>}
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">Included Hours</div>
              <div className="font-bold text-slate-800">{includedHours}h/month</div>
              {topupHours > 0 && <div className="text-[11px] text-blue-600">{baseHours}h base + {topupHours}h top-up</div>}
            </div>
            <div><div className="text-slate-400 text-xs mb-1">Extra Rate</div><div className="font-bold text-slate-800">${pkg?.extra_hourly_rate}/hr</div></div>
          </div>
          {(topupHours > 0 || topupRequests > 0) && (
            <p className="text-xs text-blue-600 mt-3">
              ✦ Your plan includes extra capacity top-ups: {topupHours > 0 ? `+${topupHours}h ` : ''}{topupRequests > 0 ? `+${topupRequests} tickets` : ''}.
            </p>
          )}
        </div>

        {/* What's Included in Your Plan */}
        {pkg && (planBenefits.length > 0 || planTerms.length > 0) && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="font-display font-bold text-slate-800">What&apos;s Included in Your Plan</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {pkg.name} — ${pkg.price}/month
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {[...planBenefits, ...planTerms].map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Extras & Capacity */}
        {(extrasData?.length || 0) > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-display font-bold text-slate-800 mb-4">Your Extras &amp; Capacity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {extrasData!.map((x: any) => {
                const done = x.qty_used >= x.qty_total
                const left = Math.max(0, x.qty_total - x.qty_used)
                const unit = x.unit === 'hours' ? (left === 1 ? 'hour' : 'hours') : x.unit === 'tickets' ? (left === 1 ? 'ticket' : 'tickets') : ''
                return (
                  <div key={x.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{x.name}</span>
                      <span className={`text-xs font-bold ${done ? 'text-red-500' : 'text-slate-500'}`}>
                        {done ? 'All used' : `${left}${unit ? ` ${unit}` : ` of ${x.qty_total}`} left`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, (x.qty_used / x.qty_total) * 100)}%`, background: done ? '#ef4444' : '#2563eb' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
