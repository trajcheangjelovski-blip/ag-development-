import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { EmptyState } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

// Platform-wide activity log (admin only) — every action across all clients.
export default async function AdminActivity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, actor:profiles!actor_id(full_name, role), ticket:tickets(id, title), client:clients(id, business_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const actionColors: Record<string, string> = {
    'Ticket created': 'bg-blue-500',
    'Status changed': 'bg-amber-500',
    'Comment added': 'bg-purple-500',
    'Time entry added': 'bg-green-500',
    'Proof uploaded': 'bg-emerald-500',
    'Ticket completed': 'bg-green-600',
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Activity Log</h1>
          <p className="text-slate-500 text-sm mt-1">Everything that happens across the platform — all clients, all tickets.</p>
        </div>
        <div className="card overflow-hidden">
          {!logs?.length ? (
            <EmptyState icon="📜" title="No activity yet" description="Platform activity will be logged here automatically." />
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((a: any) => (
                <div key={a.id} className="flex gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${actionColors[a.action] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{a.action}</span>
                        {a.detail && <span className="text-sm text-slate-500 ml-2">— {a.detail}</span>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(a.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">
                        by {a.actor
                          ? (a.actor.role === 'admin' ? `${a.actor.full_name.split(' ')[0]} from AG Development` : a.actor.full_name)
                          : 'AG Development'}
                      </span>
                      {a.client && (
                        <Link href={`/admin/clients/${a.client.id}`} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                          🏢 {a.client.business_name}
                        </Link>
                      )}
                      {a.ticket && (
                        <Link href={`/admin/tickets/${a.ticket.id}`} className="text-xs text-blue-600 hover:underline truncate">
                          {a.ticket.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
