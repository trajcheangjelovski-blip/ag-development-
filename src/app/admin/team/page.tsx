'use client'
import { useEffect, useState, useCallback } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { PRESETS, PERMISSION_GROUPS, type PresetKey } from '@/lib/permissions'

type AdminRow = {
  id: string; full_name: string; email: string; admin_role: PresetKey | null
  permissions: string[]; client_scope: 'all' | 'assigned'; assignedClientIds: string[]
}
type ClientRow = { id: string; business_name: string }

const ROLE_OPTIONS: PresetKey[] = ['master', 'manager', 'support', 'billing', 'viewer']

const blankForm = {
  id: '' as string,
  full_name: '',
  email: '',
  password: '',
  admin_role: 'support' as PresetKey,
  permissions: [...PRESETS.support.permissions] as string[],
  client_scope: 'assigned' as 'all' | 'assigned',
  assignedClientIds: [] as string[],
}

export default function AdminTeam() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')
  const [editing, setEditing] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...blankForm })

  const load = useCallback(async () => {
    const res = await fetch('/api/admins')
    if (res.status === 403) { setDenied(true); setLoading(false); return }
    if (res.ok) setAdmins((await res.json()).admins || [])
    const sb = createClient()
    const { data } = await sb.from('clients').select('id, business_name').order('business_name')
    setClients(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() {
    setForm({ ...blankForm, permissions: [...PRESETS.support.permissions] })
    setIsNew(true); setError(''); setEditing(true)
  }
  function openEdit(a: AdminRow) {
    setForm({
      id: a.id, full_name: a.full_name, email: a.email, password: '',
      admin_role: (a.admin_role || 'support'), permissions: a.permissions || [],
      client_scope: a.client_scope || 'all', assignedClientIds: a.assignedClientIds || [],
    })
    setIsNew(false); setError(''); setEditing(true)
  }

  function applyPreset(role: PresetKey) {
    const p = PRESETS[role]
    setForm(f => ({ ...f, admin_role: role, permissions: [...p.permissions], client_scope: p.scope }))
  }
  function togglePerm(key: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter(k => k !== key) : [...f.permissions, key],
    }))
  }
  function toggleClient(id: string) {
    setForm(f => ({
      ...f,
      assignedClientIds: f.assignedClientIds.includes(id) ? f.assignedClientIds.filter(c => c !== id) : [...f.assignedClientIds, id],
    }))
  }

  async function save() {
    setSaving(true); setError('')
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch('/api/admins', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setBanner(isNew ? `Admin "${form.full_name}" created.` : `"${form.full_name}" updated.`)
      setEditing(false); load()
    } else {
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  async function removeAdmin(a: AdminRow) {
    if (!confirm(`Remove ${a.full_name}? Their login will be deleted.`)) return
    const res = await fetch(`/api/admins?id=${a.id}`, { method: 'DELETE' })
    if (res.ok) { setBanner(`${a.full_name} removed.`); load() }
    else setError((await res.json().catch(() => ({})))?.error || 'Failed to remove')
  }

  const isMasterRole = form.admin_role === 'master'

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800">Team</h1>
            <p className="text-slate-500 text-sm mt-1">Create admins, set their role &amp; permissions, and choose which clients they can see.</p>
          </div>
          {!denied && <button onClick={openNew} className="btn-secondary text-sm">+ New Admin</button>}
        </div>

        {banner && <div className="mb-4"><Alert type="success" message={banner} /></div>}

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : denied ? (
          <div className="card p-6 text-sm text-slate-600">Only the Master Admin can manage the team.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Client access</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="table-td font-semibold text-slate-800">{a.full_name}</td>
                      <td className="table-td text-slate-500">{a.email}</td>
                      <td className="table-td">{PRESETS[(a.admin_role || 'support') as PresetKey]?.label || a.admin_role}</td>
                      <td className="table-td text-slate-500">
                        {a.client_scope === 'all' ? 'All clients' : `${a.assignedClientIds.length} assigned`}
                      </td>
                      <td className="table-td text-right whitespace-nowrap">
                        <button onClick={() => openEdit(a)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                        <button onClick={() => removeAdmin(a)} className="ml-3 text-xs text-red-600 hover:underline font-medium">Remove</button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr><td className="table-td text-slate-400 text-center" colSpan={5}>No admins yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEditing(false)}>
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">{isNew ? 'New Admin' : `Edit ${form.full_name}`}</h2>
                <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="form-label">Full name</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.admin_role} onChange={e => applyPreset(e.target.value as PresetKey)}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{PRESETS[r].label}</option>)}
                  </select>
                </div>
              </div>

              {isNew && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="form-label">Email (login)</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Temporary password</label>
                    <input className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="min 8 characters" />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 mb-4">{PRESETS[form.admin_role].description}</p>

              {isMasterRole ? (
                <div className="card p-4 mb-4 text-sm text-slate-600 bg-slate-50">
                  Master Admin has full access to everything, including managing the team and settings.
                </div>
              ) : (
                <div className="mb-5">
                  <label className="form-label mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {PERMISSION_GROUPS.map(g => (
                      <div key={g.group}>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{g.group}</div>
                        <div className="space-y-1">
                          {g.perms.map(p => (
                            <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isMasterRole && (
                <div className="mb-5">
                  <label className="form-label mb-2">Client access</label>
                  <div className="flex gap-4 mb-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.client_scope === 'all'} onChange={() => setForm(f => ({ ...f, client_scope: 'all' }))} />
                      All clients
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.client_scope === 'assigned'} onChange={() => setForm(f => ({ ...f, client_scope: 'assigned' }))} />
                      Only assigned clients
                    </label>
                  </div>
                  {form.client_scope === 'assigned' && (
                    <div className="border border-slate-200 rounded-lg p-3 max-h-44 overflow-y-auto grid grid-cols-2 gap-1">
                      {clients.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.assignedClientIds.includes(c.id)} onChange={() => toggleClient(c.id)} />
                          <span className="truncate">{c.business_name}</span>
                        </label>
                      ))}
                      {clients.length === 0 && <span className="text-xs text-slate-400">No clients yet.</span>}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-secondary flex items-center gap-2" onClick={save} disabled={saving}>
                  {saving ? <><Spinner size="sm" /> Saving…</> : isNew ? 'Create Admin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
