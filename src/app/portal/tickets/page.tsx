import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatusBadge, PriorityBadge, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ReopenTicketButton } from '@/components/portal/ReopenTicketButton'

export const dynamic = 'force-dynamic'

export default async function ClientTickets({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const activeStatus = (await searchParams).status || 'All'
  let query = supabase.from('tickets').select('*').eq('client_id', profile.client_id).neq('category', 'Message').order('created_at', { ascending: false })
  if (activeStatus !== 'All') query = query.eq('status', activeStatus)
  const { data: tickets } = await query

  const statuses = ['All', 'Open', 'In Progress', 'Waiting Client', 'Completed', 'Closed']

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">My Tickets</h1>
          <Link href="/portal/tickets/new" className="btn-secondary">+ New Request</Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {statuses.map(s => (
            <Link key={s} href={`/portal/tickets?status=${s}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeStatus === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          {!tickets?.length ? (
            <EmptyState icon="🎫" title="No tickets found" description="Submit a support request whenever you need help with your website, email, or tech."
              action={<Link href="/portal/tickets/new" className="btn-secondary">New Support Request</Link>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Submitted</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td max-w-xs truncate">
                        <Link href={`/portal/tickets/${t.id}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors">
                          {t.title}
                        </Link>
                      </td>
                      <td className="table-td text-slate-500 text-xs">{t.category}</td>
                      <td className="table-td"><PriorityBadge priority={t.priority} /></td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                      <td className="table-td text-slate-400 text-xs">{formatDate(t.created_at)}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <Link href={`/portal/tickets/${t.id}`} className="text-xs text-blue-600 hover:underline font-medium">View →</Link>
                          {['Completed', 'Closed'].includes(t.status) && (
                            <ReopenTicketButton ticketId={t.id} ticketTitle={t.title} />
                          )}
                        </div>
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
