'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatusBadge, EmptyState, Spinner, Alert } from '@/components/ui'
import { formatDate, currentBillingMonth } from '@/lib/utils'

interface Invoice {
  id: string; client_id: string; billing_month: string; description: string
  amount: number; status: string; due_date?: string; paid_at?: string
  client?: { business_name: string }
}
interface Client { id: string; business_name: string }

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ client_id: '', billing_month: currentBillingMonth(), description: '', amount: 0, status: 'Pending', due_date: '' })

  async function load() {
    setLoading(true)
    const [iRes, cRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/clients')])
    if (iRes.ok) setInvoices(await iRes.json())
    if (cRes.ok) setClients(await cRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  async function createInvoice() {
    if (!form.client_id || !form.description || !form.amount) { setError('Client, description, and amount are required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setShowModal(false); load() } else { const d = await res.json(); setError(d.error) }
    setSaving(false)
  }

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Invoices</h1>
          <button className="btn-secondary" onClick={() => setShowModal(true)}>+ New Invoice</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Paid</div><div className="font-display text-2xl font-extrabold text-green-600">${totalPaid}</div></div>
          <div className="card p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pending</div><div className="font-display text-2xl font-extrabold text-amber-600">${totalPending}</div></div>
          <div className="card p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Overdue</div><div className="font-display text-2xl font-extrabold text-red-600">${totalOverdue}</div></div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 mb-5 text-sm text-amber-800">
          💡 Invoice placeholder. For full payment processing, integrate Stripe Billing or QuickBooks.
        </div>

        <div className="card overflow-hidden">
          {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : !invoices.length ? <EmptyState icon="💳" title="No invoices" description="Create invoices for your clients." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Client</th>
                    <th className="table-th">Description</th>
                    <th className="table-th">Month</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Paid On</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="table-td font-semibold">{inv.client?.business_name}</td>
                      <td className="table-td text-slate-500">{inv.description}</td>
                      <td className="table-td text-slate-500">{inv.billing_month}</td>
                      <td className="table-td font-bold">${inv.amount}</td>
                      <td className="table-td"><StatusBadge status={inv.status} /></td>
                      <td className="table-td text-slate-400">{inv.paid_at ? formatDate(inv.paid_at) : '—'}</td>
                      <td className="table-td">
                        <select className="form-input py-1 text-xs w-auto" value={inv.status} onChange={e => updateStatus(inv.id, e.target.value)}>
                          {['Pending','Paid','Overdue','Cancelled'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">New Invoice</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 text-xl">×</button>
              </div>
              {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
              <div className="space-y-3">
                <div>
                  <label className="form-label">Client</label>
                  <select className="form-input" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}>
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Month</label>
                    <input type="month" className="form-input" value={form.billing_month} onChange={e => setForm(p => ({ ...p, billing_month: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Amount ($)</label>
                    <input type="number" className="form-input" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. Business Care — June 2025" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      {['Pending','Paid','Overdue'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-secondary flex items-center gap-2" onClick={createInvoice} disabled={saving}>
                  {saving ? <><Spinner size="sm" />Saving...</> : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
