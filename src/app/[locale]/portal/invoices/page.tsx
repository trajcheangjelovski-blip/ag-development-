import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatusBadge, EmptyState } from '@/components/ui'
import { PayInvoiceButton } from '@/components/portal/PayInvoiceButton'
import { formatDate } from '@/lib/utils'
import { clientCan } from '@/lib/permissions'

export default async function ClientInvoices() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')
  // Members without billing access can't view invoices
  if (!clientCan(profile as any, 'billing')) redirect('/portal/dashboard')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })

  const totalPaid = invoices?.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0) || 0
  const totalPending = invoices?.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.amount, 0) || 0

  return (
    <PortalLayout>
      <div className="p-8">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">Invoices</h1>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 mb-6 text-sm text-blue-800">
          💳 Pay pending invoices securely online with Stripe using the &quot;Pay Now&quot; button. Questions? Contact us at support@ag-development.dev.
        </div>

        {invoices && invoices.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Paid</div>
              <div className="font-display text-2xl font-extrabold text-green-600">${totalPaid}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pending / Overdue</div>
              <div className={`font-display text-2xl font-extrabold ${totalPending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>${totalPending}</div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {!invoices?.length ? (
            <EmptyState icon="💳" title="No invoices yet" description="Your monthly subscription invoices will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Description</th>
                    <th className="table-th">Month</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Paid On</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="table-td font-semibold">{inv.description}</td>
                      <td className="table-td text-slate-500">{inv.billing_month}</td>
                      <td className="table-td font-bold">${inv.amount}</td>
                      <td className="table-td text-slate-500">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className="table-td"><StatusBadge status={inv.status} /></td>
                      <td className="table-td text-slate-400">{inv.paid_at ? formatDate(inv.paid_at) : '—'}</td>
                      <td className="table-td">
                        {['Pending', 'Overdue'].includes(inv.status) && <PayInvoiceButton invoiceId={inv.id} />}
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
