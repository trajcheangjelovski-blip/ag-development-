'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { StatCard, EmptyState, Spinner, Alert } from '@/components/ui'
import { formatDate, formatMinutes, formatMonth, currentBillingMonth } from '@/lib/utils'

interface Client { id: string; business_name: string }
interface Report {
  id: string; client_id: string; report_month: string; completed_tickets: number
  total_minutes: number; website_updates: string; recommendations: string; next_improvements: string
  created_at: string; client?: { business_name: string }
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    client_id: '', report_month: currentBillingMonth(),
    completed_tickets: 0, total_minutes: 0,
    website_updates: '', recommendations: '', next_improvements: '',
  })

  async function load() {
    setLoading(true)
    const [rRes, cRes] = await Promise.all([
      fetch('/api/reports'),
      fetch('/api/clients'),
    ])
    if (rRes.ok) setReports(await rRes.json())
    if (cRes.ok) setClients(await cRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveReport() {
    if (!form.client_id) { setError('Please select a client'); return }
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setSuccess('Report created successfully')
      setForm({ client_id: '', report_month: currentBillingMonth(), completed_tickets: 0, total_minutes: 0, website_updates: '', recommendations: '', next_improvements: '' })
      load()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create report')
    }
    setSaving(false)
  }

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Monthly Reports</h1>
          <button className="btn-secondary" onClick={() => setShowModal(true)}>+ New Report</button>
        </div>

        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !reports.length ? (
          <div className="card"><EmptyState icon="📊" title="No reports yet" description="Create monthly reports to summarize work done for each client." action={<button className="btn-secondary" onClick={() => setShowModal(true)}>Create First Report</button>} /></div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-800">{r.client?.business_name} — {formatMonth(r.report_month)}</h2>
                    <p className="text-xs text-slate-400 mt-1">Created {formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex gap-5 text-sm text-slate-600">
                    <span><strong>{r.completed_tickets}</strong> tickets</span>
                    <span><strong>{formatMinutes(r.total_minutes)}</strong></span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[['Updates', r.website_updates], ['Recommendations', r.recommendations], ['Next Steps', r.next_improvements]].filter(([, v]) => v).map(([l, v]) => (
                    <div key={l as string}>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{l}</div>
                      <p className="text-sm text-slate-600 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">Create Monthly Report</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 text-xl">×</button>
              </div>
              {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Client</label>
                    <select className="form-input" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}>
                      <option value="">Select client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Month</label>
                    <input type="month" className="form-input" value={form.report_month} onChange={e => setForm(p => ({ ...p, report_month: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tickets Completed</label>
                    <input type="number" className="form-input" min="0" value={form.completed_tickets} onChange={e => setForm(p => ({ ...p, completed_tickets: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="form-label">Total Minutes Worked</label>
                    <input type="number" className="form-input" min="0" value={form.total_minutes} onChange={e => setForm(p => ({ ...p, total_minutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                {[
                  ['website_updates', 'Website Updates Completed'],
                  ['recommendations', 'Recommendations'],
                  ['next_improvements', 'Next Suggested Improvements'],
                ].map(([id, label]) => (
                  <div key={id}>
                    <label className="form-label">{label}</label>
                    <textarea className="form-input min-h-16 resize-none" value={(form as any)[id]} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-secondary flex items-center gap-2" onClick={saveReport} disabled={saving}>
                  {saving ? <><Spinner size="sm" /> Saving...</> : 'Create Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
