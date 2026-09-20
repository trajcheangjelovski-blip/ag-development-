'use client'
import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'

type Member = {
  id: string; full_name: string; email: string; client_role: 'leader' | 'member'
  can_view_billing: boolean; can_view_all_tickets: boolean
}

const blank = {
  id: '', full_name: '', email: '', password: '',
  client_role: 'member' as 'leader' | 'member',
  can_view_billing: false, can_view_all_tickets: true,
}

export default function ClientTeam() {
  const t = useTranslations('portal.team')
  const tc = useTranslations('portal.common')
  const [members, setMembers] = useState<Member[]>([])
  const [isLeader, setIsLeader] = useState(false)
  const [teamEnabled, setTeamEnabled] = useState(true)
  const [seats, setSeats] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')
  const [form, setForm] = useState({ ...blank })

  const load = useCallback(async () => {
    const res = await fetch('/api/team')
    if (res.ok) {
      const d = await res.json()
      setMembers(d.members || []); setIsLeader(!!d.isLeader)
      setTeamEnabled(!!d.teamEnabled); setSeats(d.seats ?? null)
    }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() { setForm({ ...blank }); setIsNew(true); setError(''); setEditing(true) }
  function openEdit(m: Member) {
    setForm({ id: m.id, full_name: m.full_name, email: m.email, password: '', client_role: m.client_role, can_view_billing: m.can_view_billing, can_view_all_tickets: m.can_view_all_tickets })
    setIsNew(false); setError(''); setEditing(true)
  }

  async function save() {
    setSaving(true); setError('')
    const res = await fetch('/api/team', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setBanner(isNew ? t('addedBanner', { name: form.full_name }) : t('updatedBanner', { name: form.full_name })); setEditing(false); load() }
    else setError(data.error || t('failSave'))
    setSaving(false)
  }

  async function remove(m: Member) {
    if (!confirm(t('confirmRemove', { name: m.full_name }))) return
    const res = await fetch(`/api/team?id=${m.id}`, { method: 'DELETE' })
    if (res.ok) { setBanner(t('removedBanner', { name: m.full_name })); load() }
    else setError((await res.json().catch(() => ({})))?.error || t('failRemove'))
  }

  const isLeaderRole = form.client_role === 'leader'

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800">{t('title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
          </div>
          {isLeader && teamEnabled && <button onClick={openNew} className="btn-secondary text-sm">{t('addMember')}</button>}
        </div>

        {banner && <div className="mb-4"><Alert type="success" message={banner} /></div>}

        {!loading && !teamEnabled && (
          <div className="mb-4"><Alert type="info" message={t('planNoTeam')} /></div>
        )}
        {!loading && teamEnabled && seats != null && (
          <p className="text-xs text-slate-400 mb-4">{t('seatsUsed', { used: members.length, total: seats })}</p>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">{tc('loading')}</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">{t('colName')}</th>
                    <th className="table-th">{t('colEmail')}</th>
                    <th className="table-th">{t('colRole')}</th>
                    <th className="table-th">{t('colAccess')}</th>
                    {isLeader && <th className="table-th"></th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="table-td font-semibold text-slate-800">{m.full_name}</td>
                      <td className="table-td text-slate-500">{m.email}</td>
                      <td className="table-td">{m.client_role === 'leader' ? t('roleLeader') : t('roleMember')}</td>
                      <td className="table-td text-slate-500 text-xs">
                        {m.client_role === 'leader'
                          ? t('fullAccess')
                          : [m.can_view_all_tickets ? t('accessAllTickets') : t('accessOwnTickets'), m.can_view_billing ? t('accessBilling') : null].filter(Boolean).join(' · ')}
                      </td>
                      {isLeader && (
                        <td className="table-td text-right whitespace-nowrap">
                          <button onClick={() => openEdit(m)} className="text-xs text-blue-600 hover:underline font-medium">{tc('edit')}</button>
                          <button onClick={() => remove(m)} className="ml-3 text-xs text-red-600 hover:underline font-medium">{tc('remove')}</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td className="table-td text-slate-400 text-center" colSpan={isLeader ? 5 : 4}>{t('noMembers')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !isLeader && (
          <p className="text-xs text-slate-400 mt-3">{t('onlyLeader')}</p>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEditing(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">{isNew ? t('addTeamMember') : t('editMember', { name: form.full_name })}</h2>
                <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

              <div className="mb-4">
                <label className="form-label">{t('fullNameLabel')}</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>

              {isNew && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="form-label">{t('emailLoginLabel')}</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">{t('tempPasswordLabel')}</label>
                    <input className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={t('min8')} />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">{t('roleLabelField')}</label>
                <select className="form-input" value={form.client_role} onChange={e => setForm(f => ({ ...f, client_role: e.target.value as any }))}>
                  <option value="member">{t('optionMember')}</option>
                  <option value="leader">{t('optionLeader')}</option>
                </select>
              </div>

              {!isLeaderRole && (
                <div className="space-y-2 mb-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.can_view_all_tickets} onChange={e => setForm(f => ({ ...f, can_view_all_tickets: e.target.checked }))} />
                    {t('canSeeAllTickets')}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.can_view_billing} onChange={e => setForm(f => ({ ...f, can_view_billing: e.target.checked }))} />
                    {t('canViewBilling')}
                  </label>
                </div>
              )}
              {isLeaderRole && (
                <p className="text-xs text-slate-400 mb-5">{t('leaderFullAccess')}</p>
              )}

              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setEditing(false)}>{tc('cancel')}</button>
                <button className="btn-secondary flex items-center gap-2" onClick={save} disabled={saving}>
                  {saving ? <><Spinner size="sm" /> {tc('saving')}</> : isNew ? t('addMemberBtn') : tc('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
