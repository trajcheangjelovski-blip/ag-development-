// portal/reports/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, EmptyState } from '@/components/ui'
import { formatDate, formatMinutes, formatMonth } from '@/lib/utils'

export default async function ClientReports() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const { data: reports } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('report_month', { ascending: false })

  return (
    <PortalLayout>
      <div className="p-8">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">Monthly Reports</h1>
        {!reports?.length ? (
          <div className="card">
            <EmptyState icon="📊" title="No reports yet" description="Monthly reports will appear here once your account manager creates them for your account." />
          </div>
        ) : (
          <div className="space-y-5">
            {reports.map((r: any) => (
              <div key={r.id} className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-extrabold text-slate-800">{formatMonth(r.report_month)}</h2>
                  <span className="text-xs text-slate-400">Created {formatDate(r.created_at)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatCard label="Tickets Completed" value={r.completed_tickets} />
                  <StatCard label="Total Support Time" value={formatMinutes(r.total_minutes)} />
                </div>
                {[
                  ['Website Updates Completed', r.website_updates],
                  ['Recommendations', r.recommendations],
                  ['Next Suggested Improvements', r.next_improvements],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label as string} className="mb-4 last:mb-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{val}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
