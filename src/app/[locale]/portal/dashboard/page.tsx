import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, StatusBadge, PriorityBadge, ProgressBar, EmptyState } from '@/components/ui'
import { PayInvoiceButton } from '@/components/portal/PayInvoiceButton'
import { BuyExtraHourButton } from '@/components/portal/BuyExtraHourButton'
import { getClientPlanState } from '@/lib/planUsage'
import { formatDate, formatDateTime, formatMinutes, currentBillingMonth } from '@/lib/utils'
import { formatPrice } from '@/lib/money'
import { clientCan } from '@/lib/permissions'
import { Link } from '@/i18n/navigation'

export default async function ClientDashboard() {
  const locale = await getLocale()
  const t = await getTranslations('portal.dashboard')
  const tc = await getTranslations('portal.common')
  const tp = await getTranslations('portal.planTerms')
  const fmt = (n: number) => formatPrice(n, locale === 'mk' ? 'MKD' : 'USD', locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect(`/${locale}/login`)

  const clientId = profile.client_id
  const month = currentBillingMonth()
  // Members restricted to their own tickets only count/list what they created
  const ownOnly = !clientCan(profile as any, 'allTickets')
  const own = (q: any) => (ownOnly ? q.eq('created_by', user.id) : q)

  const [
    { data: client },
    { data: openTickets },
    { data: recentTickets },
    { data: monthEntries },
    { data: monthTickets },
    { data: activity },
    { data: unpaidInvoices },
    { data: clientExtras },
  ] = await Promise.all([
    supabase.from('clients').select('*, package:support_packages(*)').eq('id', clientId).single(),
    own(supabase.from('tickets').select('id').eq('client_id', clientId).neq('category', 'Message').not('status', 'in', '("Completed","Closed")')),
    own(supabase.from('tickets').select('*').eq('client_id', clientId).neq('category', 'Message').order('created_at', { ascending: false }).limit(5)),
    supabase.from('time_entries').select('minutes').eq('client_id', clientId).eq('billing_month', month),
    own(supabase.from('tickets').select('id').eq('client_id', clientId).neq('category', 'Message').like('created_at', `${month}%`)),
    supabase.from('activity_logs').select('*, actor:profiles(full_name)').eq('client_id', clientId).order('created_at', { ascending: false }).limit(8),
    supabase.from('invoices').select('*').eq('client_id', clientId).in('status', ['Pending', 'Overdue']).order('due_date', { ascending: true }),
    supabase.from('client_extras').select('*').eq('client_id', clientId).order('created_at'),
  ])

  const pkg = (client as any)?.package
  const dueInvoices = unpaidInvoices || []
  const totalDue = dueInvoices.reduce((s: number, i: any) => s + i.amount, 0)
  const today = new Date().toISOString().slice(0, 10)
  const hasOverdue = dueInvoices.some(
    (i: any) => i.status === 'Overdue' || (i.due_date && i.due_date < today)
  )

  // Plan period state (1 month from order) — drives usage display + blocking
  const planState = await getClientPlanState(clientId)
  const usedMinutes = planState?.usedMinutes ?? (monthEntries?.reduce((s, e) => s + e.minutes, 0) || 0)
  const usedRequests = planState?.usedRequests ?? (monthTickets?.length || 0)
  const baseHours = pkg?.hours_per_month || 0
  const baseRequests = pkg?.requests_per_month || 0
  // Include unused extra credits (e.g. extra tickets/hours added by the admin)
  // in the allowance shown on the stat cards and progress bars.
  const includedHours = planState ? planState.includedMinutes / 60 : baseHours
  const includedRequests = planState?.includedRequests ?? baseRequests
  const periodLabel = planState
    ? `${formatDate(planState.periodStart.toISOString())} — ${formatDate(planState.periodEnd.toISOString())}`
    : new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // Everything the client's package includes (from the plan description + terms)
  const planBenefits: string[] = []
  if (pkg?.description) {
    for (const line of String(pkg.description).split('\n')) {
      const includes = line.match(/^Includes:\s*(.+)$/i)
      if (includes) planBenefits.push(...includes[1].split(/,\s*/).filter(Boolean))
      else if (line.trim()) planBenefits.push(line.trim())
    }
  }
  const planTerms: string[] = pkg ? [
    baseRequests > 0 ? tp('requests', { count: baseRequests }) : '',
    baseHours > 0 ? tp('hours', { hours: baseHours }) : '',
    pkg.response_time ? tp('firstResponse', { time: pkg.response_time.toLowerCase().startsWith('within') ? pkg.response_time.toLowerCase() : pkg.response_time }) : '',
    pkg.extra_hourly_rate ? tp('extraRate', { rate: tc('perHour', { price: fmt(pkg.extra_hourly_rate) }) }) : '',
  ].filter(Boolean) : []

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-xl font-extrabold text-slate-800">
            {t('welcome', { name: profile.full_name.split(' ')[0] })}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{(client as any)?.business_name} · {pkg?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label={t('planLabel')} value={pkg?.name || '—'} sub={pkg ? tc('perMonth', { price: fmt(pkg.price) }) : ''} accent />
          <StatCard label={t('openTickets')} value={openTickets?.length || 0} sub={t('activeRequests')} />
          <StatCard label={t('hoursUsed')} value={`${(usedMinutes/60).toFixed(1)}h`} sub={t('ofHoursIncluded', { hours: includedHours })} />
          <StatCard label={t('requestsUsed')} value={usedRequests} sub={t('ofRequestsIncluded', { count: includedRequests })} />
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
                {hasOverdue ? t('paymentOverdue') : t('balanceDue')}
              </div>
              <div className="font-display text-2xl font-extrabold" style={{ color: hasOverdue ? '#991b1b' : '#0f1f3d' }}>
                {fmt(totalDue)}
                <span className="text-sm font-medium text-slate-500 ml-2">
                  {dueInvoices.length === 1
                    ? t('invoiceOne', { description: dueInvoices[0].description, month: dueInvoices[0].billing_month })
                    : t('invoicesMany', { count: dueInvoices.length })}
                </span>
              </div>
              {dueInvoices[0]?.due_date && (
                <div className="text-xs text-slate-500 mt-0.5">{t('due', { date: formatDate(dueInvoices[0].due_date) })}</div>
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
                  {t('viewAndPay')}
                </Link>
              )}
              <Link href="/portal/invoices" className="text-xs text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap">
                {t('allInvoices')}
              </Link>
            </div>
          </div>
        )}

        {/* Credits used / plan expired */}
        {planState?.blocked && (
          <div className="card p-5 mb-6 flex flex-wrap items-center gap-4" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#b91c1c' }}>
                {planState.expired ? t('planPeriodEnded') : t('allCreditsUsed')}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#991b1b' }}>
                {planState.blockReason} {t('blockedNote')}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {!planState.expired && <BuyExtraHourButton />}
              <Link
                href="/portal/message"
                className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all"
                style={{ color: '#b91c1c', borderColor: '#fca5a5', background: 'white' }}
              >
                {t('messageUs')}
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all"
                style={{ color: '#b91c1c', borderColor: '#fca5a5', background: 'white' }}
              >
                {planState.expired ? t('renewPlan') : t('upgradePlan')}
              </Link>
            </div>
          </div>
        )}

        {/* Usage */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-slate-800 mb-4">
            {t('thisPeriodUsage')} <span className="text-sm font-medium text-slate-400">({periodLabel})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressBar used={usedRequests} total={includedRequests} label={tc('supportRequests')} />
            <ProgressBar used={parseFloat((usedMinutes/60).toFixed(1))} total={includedHours} label={tc('supportHours')} />
          </div>
          {usedMinutes > includedHours * 60 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {t('overHours', { time: formatMinutes(usedMinutes - includedHours * 60), rate: tc('perHour', { price: fmt(pkg?.extra_hourly_rate) }) })}
            </div>
          )}
          <div className="mt-4 text-xs text-slate-400">
            {t('planSummary', { requests: includedRequests, hours: includedHours, response: pkg?.response_time, rate: tc('perHour', { price: fmt(pkg?.extra_hourly_rate) }) })}
          </div>
        </div>

        {/* What's included in the plan */}
        {pkg && (planBenefits.length > 0 || planTerms.length > 0) && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="font-display font-bold text-slate-800">{tc('whatsIncluded')}</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {tc('planBadge', { name: pkg.name, price: tc('perMonth', { price: fmt(pkg.price) }) })}
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

            {/* Extras usage */}
            {(clientExtras?.length || 0) > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('yourExtras')}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {clientExtras!.map((x: any) => {
                    const done = x.qty_used >= x.qty_total
                    const left = Math.max(0, x.qty_total - x.qty_used)
                    const unit = x.unit === 'hours' ? (left === 1 ? tc('unitHour') : tc('unitHours')) : x.unit === 'tickets' ? (left === 1 ? tc('unitTicket') : tc('unitTickets')) : ''
                    return (
                      <div key={x.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{x.name}</span>
                          <span className={`text-xs font-bold ${done ? 'text-red-500' : 'text-slate-500'}`}>
                            {done ? tc('allUsed') : unit ? tc('extraLeft', { left, unit }) : tc('extraLeftOf', { left, total: x.qty_total })}
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tickets */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-800">{t('recentTickets')}</h2>
              <Link href="/portal/tickets" className="text-xs text-blue-600 font-medium hover:underline">{t('viewAll')}</Link>
            </div>
            {!recentTickets?.length ? (
              <EmptyState icon="✅" title={t('noTicketsYet')} description={t('noTicketsDesc')} />
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
              <Link href="/portal/tickets/new" className="btn-secondary text-xs px-3 py-2">{tc('newRequest')}</Link>
            </div>
          </div>

          {/* Activity */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-slate-800">{t('recentActivity')}</h2>
            </div>
            {!activity?.length ? (
              <EmptyState title={t('noActivityYet')} description={t('noActivityDesc')} />
            ) : (
              <div className="divide-y divide-slate-100">
                {activity.map((a: any) => (
                  <div key={a.id} className="px-5 py-3 flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700">{a.action}</div>
                      <div className="text-xs text-slate-400 truncate">{a.detail}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(a.created_at)}</div>
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
