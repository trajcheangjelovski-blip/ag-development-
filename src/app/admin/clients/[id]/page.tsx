'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, StatusBadge, PriorityBadge, ProgressBar, Spinner, Alert } from '@/components/ui'
import { formatDate, formatMinutes, currentBillingMonth } from '@/lib/utils'
import Link from 'next/link'

export default function AdminClientDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const month = currentBillingMonth()

  async function load() {
    setLoading(true)
    const [cRes, tRes, teRes, pkgRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/tickets?client_id=${id}`),
      fetch(`/api/time-entries?client_id=${id}&month=${month}`),
      fetch('/api/packages'),
    ])
    if (cRes.ok) { const c = await cRes.json(); setClient(c); setEditForm(c) }
    if (tRes.ok) setTickets(await tRes.json())
    if (teRes.ok) setTimeEntries(await teRes.json())
    if (pkgRes.ok) setPackages(await pkgRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function saveClient() {
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_name: editForm.business_name, contact_name: editForm.contact_name, phone: editForm.phone, website: editForm.website, package_id: editForm.package_id, notes: editForm.notes, is_active: editForm.is_active }),
    })
    if (res.ok) { setClient(await res.json()); setShowEdit(false); setSuccess('Client updated.') }
    else { const d = await res.json(); setError(d.error) }
    setSaving(false)
  }

  if (loading) return <PortalLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></PortalLayout>
  if (!client) return <PortalLayout><div className="p-8 text-slate-500">Client not found.</div></PortalLayout>

  const pkg = client.package
  const usedMinutes = timeEntries.reduce((s: number, e: any) => s + e.minutes, 0)
  const openTickets = tickets.filter((t: any) => !['Completed', 'Closed'].includes(t.status))

  return (
    <PortalLayout>
      <div className="p-8">
        <button onClick={() => router.push('/admin/clients')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5">
          ← Back to Clients
        </button>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800">{client.business_name}</h1>
            <p className="text-slate-500 text-sm mt-1">{client.contact_name} · {client.email}</p>
          </div>
          <button className="btn-ghost text-sm" onClick={() => setShowEdit(true)}>✏️ Edit Client</button>
        </div>

        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Plan" value={pkg?.name || '—'} sub={pkg ? `$${pkg.price}/month` : ''} accent />
          <StatCard label="Open Tickets" value={openTickets.length} sub="Active" />
          <StatCard label="Total Tickets" value={tickets.length} sub="All time" />
          <StatCard label="Hours This Month" value={`${(usedMinutes/60).toFixed(1)}h`} sub={`of ${pkg?.hours_per_month || 0}h`} />
        </div>

        {pkg && (
          <div className="card p-5 mb-6">
            <h3 className="font-display font-bold text-slate-800 text-sm mb-3">This Month's Usage — {new Date().toLocaleString('default', { month: 'long' })}</h3>
            <div className="grid grid-cols-2 gap-5">
              <ProgressBar used={tickets.filter((t: any) => t.created_at?.startsWith(month)).length} total={pkg.requests_per_month} label="Requests" />
              <ProgressBar used={parseFloat((usedMinutes/60).toFixed(1))} total={pkg.hours_per_month} label="Support Hours" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="card p-5 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Contact Info</h3>
              {[['Contact', client.contact_name], ['Email', client.email], ['Phone', client.phone || '—'], ['Website', client.website || '—'], ['Joined', formatDate(client.joined_at)], ['Status', client.is_active ? 'Active' : 'Inactive']].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            {client.notes && (
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Notes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800">Recent Tickets</h3>
              <Link href={`/admin/tickets/new`} className="text-xs text-blue-600 hover:underline">+ New</Link>
            </div>
            {tickets.slice(0, 6).map((t: any) => (
              <Link key={t.id} href={`/admin/tickets/${t.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{t.title}</div>
                  <div className="text-xs text-slate-400">{formatDate(t.created_at)}</div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
            {tickets.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No tickets yet.</div>}
          </div>
        </div>

        {/* Edit Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">Edit Client</h2>
                <button onClick={() => setShowEdit(false)} className="text-slate-400 text-xl">×</button>
              </div>
              {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">Business Name</label><input className="form-input" value={editForm.business_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, business_name: e.target.value }))} /></div>
                  <div><label className="form-label">Contact Name</label><input className="form-input" value={editForm.contact_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, contact_name: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">Phone</label><input className="form-input" value={editForm.phone || ''} onChange={e => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label className="form-label">Website</label><input className="form-input" value={editForm.website || ''} onChange={e => setEditForm((p: any) => ({ ...p, website: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Package</label>
                    <select className="form-input" value={editForm.package_id || ''} onChange={e => setEditForm((p: any) => ({ ...p, package_id: e.target.value }))}>
                      <option value="">No package</option>
                      {packages.map((pkg: any) => <option key={pkg.id} value={pkg.id}>{pkg.name} (${pkg.price}/mo)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-input" value={editForm.is_active ? 'active' : 'inactive'} onChange={e => setEditForm((p: any) => ({ ...p, is_active: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div><label className="form-label">Notes</label><textarea className="form-input min-h-20 resize-none" value={editForm.notes || ''} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button className="btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
                <button className="btn-secondary flex items-center gap-2" onClick={saveClient} disabled={saving}>
                  {saving ? <><Spinner size="sm" />Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
