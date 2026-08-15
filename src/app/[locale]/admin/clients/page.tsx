import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { EmptyState, StatusBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminClients() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const { data: clients } = await supabase
    .from('clients')
    .select('*, package:support_packages(name, price)')
    .order('created_at', { ascending: false })

  // Get open ticket counts
  const { data: ticketCounts } = await supabase
    .from('tickets')
    .select('client_id, status')
    .not('status', 'in', '("Completed","Closed")')

  const openCountByClient: Record<string, number> = {}
  ticketCounts?.forEach(t => {
    openCountByClient[t.client_id] = (openCountByClient[t.client_id] || 0) + 1
  })

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Clients</h1>
          <Link href="/admin/clients/new" className="btn-secondary">+ Add Client</Link>
        </div>

        <div className="card overflow-hidden">
          {!clients?.length ? (
            <EmptyState icon="👥" title="No clients yet" description="Add your first client to get started." action={<Link href="/admin/clients/new" className="btn-secondary">Add Client</Link>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Client</th>
                    <th className="table-th">Contact</th>
                    <th className="table-th">Package</th>
                    <th className="table-th">Joined</th>
                    <th className="table-th">Open Tickets</th>
                    <th className="table-th">Status</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td">
                        <div className="font-semibold text-slate-800">{c.business_name}</div>
                        <div className="text-xs text-slate-400">{c.website}</div>
                      </td>
                      <td className="table-td">
                        <div className="text-sm">{c.contact_name}</div>
                        <div className="text-xs text-slate-400">{c.email}</div>
                      </td>
                      <td className="table-td">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {c.package?.name || '—'}
                        </span>
                      </td>
                      <td className="table-td text-slate-400">{formatDate(c.joined_at)}</td>
                      <td className="table-td">
                        <span className={`font-bold ${(openCountByClient[c.id] || 0) > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                          {openCountByClient[c.id] || 0}
                        </span>
                      </td>
                      <td className="table-td">
                        <StatusBadge status={c.is_active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="table-td">
                        <Link href={`/admin/clients/${c.id}`} className="text-xs text-blue-600 hover:underline font-medium">View →</Link>
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
