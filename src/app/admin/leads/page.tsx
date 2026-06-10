import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatusBadge, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type LeadTypeName = 'Order' | 'Review' | 'Message' | 'Request'

function leadType(helpType: string): LeadTypeName {
  if (!helpType) return 'Request'
  if (helpType === 'Free Website Review') return 'Review'
  if (helpType.startsWith('Contact')) return 'Message'
  return 'Order'
}

const TYPE_STYLES: Record<LeadTypeName, { bg: string; color: string }> = {
  Order:   { bg: '#dcfce7', color: '#166534' },
  Review:  { bg: '#dbeafe', color: '#1d4ed8' },
  Message: { bg: '#fef3c7', color: '#92400e' },
  Request: { bg: '#f1f5f9', color: '#475569' },
}

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'All', label: 'All Types' },
  { key: 'Order', label: 'Orders' },
  { key: 'Review', label: 'Reviews' },
  { key: 'Message', label: 'Messages' },
]

export default async function AdminLeads({ searchParams }: { searchParams: { status?: string; type?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const activeStatus = searchParams.status || 'All'
  const activeType = searchParams.type || 'All'

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (activeStatus !== 'All') query = query.eq('status', activeStatus)

  const { data: allFiltered } = await query
  const leads = (allFiltered || []).filter(l => activeType === 'All' || leadType(l.help_type) === activeType)

  const statuses = ['All', 'New', 'Contacted', 'Proposal Sent', 'Won', 'Lost']
  const counts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}
  const { data: allLeads } = await supabase.from('leads').select('status, help_type')
  // Counts are contextual: status counts respect the active type filter,
  // type counts respect the active status filter.
  allLeads?.forEach(l => {
    const t = leadType(l.help_type)
    if (activeType === 'All' || t === activeType) {
      counts[l.status] = (counts[l.status] || 0) + 1
    }
    if (activeStatus === 'All' || l.status === activeStatus) {
      typeCounts[t] = (typeCounts[t] || 0) + 1
    }
  })

  const href = (status: string, type: string) => `/admin/leads?status=${encodeURIComponent(status)}&type=${encodeURIComponent(type)}`

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Leads & CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Orders, free website reviews, and messages from your public site</p>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-3">
          {statuses.map(s => (
            <Link
              key={s}
              href={href(s, activeType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeStatus === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s} {s !== 'All' && counts[s] ? `(${counts[s]})` : ''}
            </Link>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TYPE_FILTERS.map(t => (
            <Link
              key={t.key}
              href={href(activeStatus, t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${activeType === t.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
            >
              {t.label} {t.key !== 'All' && typeCounts[t.key] ? `(${typeCounts[t.key]})` : ''}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          {!leads.length ? (
            (activeStatus !== 'All' || activeType !== 'All') ? (
              <div className="py-14 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-display font-bold text-slate-800 mb-1.5">No leads match these filters</h3>
                <p className="text-sm text-slate-500 mb-5">
                  No {activeType === 'All' ? 'leads' : `${activeType.toLowerCase()}s`} with status &quot;{activeStatus}&quot;.
                </p>
                <Link href="/admin/leads" className="text-sm font-semibold text-blue-600 hover:underline">
                  Clear filters →
                </Link>
              </div>
            ) : (
              <EmptyState icon="📋" title="No leads yet" description="Orders, review requests, and messages from your public site will appear here." />
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Type</th>
                    <th className="table-th">Business</th>
                    <th className="table-th">Contact</th>
                    <th className="table-th">Budget</th>
                    <th className="table-th">Needs</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Submitted</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l: any) => {
                    const t = leadType(l.help_type)
                    const ts = TYPE_STYLES[t]
                    const time = new Date(l.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="table-td">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: ts.bg, color: ts.color }}>
                            {t}
                          </span>
                        </td>
                        <td className="table-td">
                          <div className="font-semibold text-slate-800">{l.business_name}</div>
                          <div className="text-xs text-slate-400">{l.website}</div>
                        </td>
                        <td className="table-td">
                          <div className="text-sm">{l.full_name}</div>
                          <div className="text-xs text-slate-400">{l.email}</div>
                        </td>
                        <td className="table-td text-sm">{l.budget}</td>
                        <td className="table-td text-sm max-w-xs truncate text-slate-500">{l.help_type}</td>
                        <td className="table-td"><StatusBadge status={l.status} /></td>
                        <td className="table-td text-slate-400 text-xs whitespace-nowrap">
                          <div>{formatDate(l.created_at)}</div>
                          <div>{time}</div>
                        </td>
                        <td className="table-td">
                          <Link href={`/admin/leads/${l.id}`} className="text-xs text-blue-600 hover:underline font-medium">View →</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
