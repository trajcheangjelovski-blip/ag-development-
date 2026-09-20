'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'

export default function AccountSettings() {
  const t = useTranslations('portal.settings')
  const tc = useTranslations('portal.common')
  const supabase = createClient()

  // Profile / avatar
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Personal email connection (admins only)
  const [isAdmin, setIsAdmin] = useState(false)
  const [usingResend, setUsingResend] = useState(false)
  const [conn, setConn] = useState({ host: '', port: 587, secure: false, user: '', fromName: '', fromEmail: '' })
  const [connPass, setConnPass] = useState('')
  const [passwordSet, setPasswordSet] = useState(false)
  const [connBusy, setConnBusy] = useState(false)
  const [connTesting, setConnTesting] = useState(false)
  const [connMsg, setConnMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single()
      if (data) {
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url)
        setIsAdmin(data.role === 'admin')
        if (data.role === 'admin') {
          const res = await fetch('/api/account/email-connection')
          if (res.ok) {
            const c = await res.json()
            setUsingResend(!!c.usingResend)
            if (!c.tableMissing) {
              setConn({
                host: c.host || '', port: c.port || 587, secure: !!c.secure,
                user: c.user || '', fromName: c.fromName || '', fromEmail: c.fromEmail || '',
              })
              setPasswordSet(!!c.passwordSet)
            }
          }
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveConnection() {
    setConnBusy(true)
    setConnMsg(null)
    try {
      const body: Record<string, unknown> = { ...conn }
      if (connPass.trim()) body.password = connPass.trim()
      const res = await fetch('/api/account/email-connection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('couldNotSave'))
      setConnMsg({ ok: true, text: t('connectionSaved') })
      if (connPass.trim()) { setPasswordSet(true); setConnPass('') }
    } catch (e) {
      setConnMsg({ ok: false, text: e instanceof Error ? e.message : t('couldNotSave') })
    } finally {
      setConnBusy(false)
    }
  }

  async function testConnection() {
    setConnTesting(true)
    setConnMsg(null)
    try {
      const res = await fetch('/api/account/email-connection', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('testFailed'))
      setConnMsg({ ok: true, text: t('testSent', { to: data.to }) })
    } catch (e) {
      setConnMsg({ ok: false, text: e instanceof Error ? e.message : t('testFailed') })
    } finally {
      setConnTesting(false)
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarBusy(true)
    setAvatarMsg(null)
    try {
      const data = new FormData()
      data.append('avatar', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: data })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || t('uploadFailed'))
      setAvatarUrl(body.avatar_url)
      setAvatarMsg({ ok: true, text: t('pictureUpdated') })
    } catch (err) {
      setAvatarMsg({ ok: false, text: err instanceof Error ? err.message : t('uploadFailed') })
    } finally {
      setAvatarBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true)
    setAvatarMsg(null)
    const res = await fetch('/api/account/avatar', { method: 'DELETE' })
    if (res.ok) {
      setAvatarUrl(null)
      setAvatarMsg({ ok: true, text: t('pictureRemoved') })
    } else {
      setAvatarMsg({ ok: false, text: t('couldNotRemovePicture') })
    }
    setAvatarBusy(false)
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPass.length < 8) {
      setError(t('newPassMin8'))
      return
    }
    if (newPass !== confirmPass) {
      setError(t('newPassNoMatch'))
      return
    }

    setLoading(true)

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setError(t('notAuthenticated')); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPass,
    })

    if (signInErr) {
      setError(t('currentPassIncorrect'))
      setLoading(false)
      return
    }

    // Now update to the new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    setSuccess(t('passwordUpdated'))
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
    setLoading(false)
  }

  return (
    <PortalLayout>
      <div className="p-8 max-w-lg">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-1">{t('title')}</h1>
        <p className="text-sm text-slate-500 mb-8">{t('subtitle')}</p>

        {/* Profile picture / logo */}
        <div className="card p-7 mb-6">
          <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
            {t('profilePicture')}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {t('profilePictureDesc')}
          </p>

          {avatarMsg && (
            <div className="mb-4">
              <Alert type={avatarMsg.ok ? 'success' : 'error'} message={avatarMsg.text} />
            </div>
          )}

          <div className="flex items-center gap-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-slate-200 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-display font-bold text-white text-lg flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="btn-secondary text-xs px-4 py-2.5 cursor-pointer">
                {avatarBusy ? t('working') : avatarUrl ? t('changePicture') : t('uploadPicture')}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={avatarBusy} />
              </label>
              {avatarUrl && (
                <button onClick={removeAvatar} disabled={avatarBusy} className="text-xs font-semibold text-red-500 hover:text-red-600">
                  {tc('remove')}
                </button>
              )}
              <span className="text-xs text-slate-400 w-full">{t('pictureFormats')}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="card p-7 mb-6">
            <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
              {t('emailConnection')}
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {usingResend
                ? t.rich('emailConnResend', { strong: (chunks) => <strong>{chunks}</strong> })
                : t.rich('emailConnSmtp', { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>

            {connMsg && (
              <div className="mb-4">
                <Alert type={connMsg.ok ? 'success' : 'error'} message={connMsg.text} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!usingResend && (
                <>
                  <div className="sm:col-span-2">
                    <label className="form-label">{t('smtpHost')}</label>
                    <input className="form-input" placeholder="smtp.office365.com"
                      value={conn.host} onChange={e => setConn({ ...conn, host: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">{t('port')}</label>
                    <input type="number" className="form-input" placeholder="587"
                      value={conn.port} onChange={e => setConn({ ...conn, port: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={conn.secure}
                        onChange={e => setConn({ ...conn, secure: e.target.checked })} />
                      {t('useSsl')}
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">{t('username')}</label>
                    <input className="form-input" placeholder="you@yourdomain.com" autoComplete="off"
                      value={conn.user} onChange={e => setConn({ ...conn, user: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">{t('password')}</label>
                    <input type="password" className="form-input" autoComplete="new-password"
                      placeholder={passwordSet ? t('passwordSavedPlaceholder') : t('passwordPlaceholder')}
                      value={connPass} onChange={e => setConnPass(e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <label className="form-label">{t('fromName')}</label>
                <input className="form-input" placeholder={t('fromNamePlaceholder')}
                  value={conn.fromName} onChange={e => setConn({ ...conn, fromName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('fromEmail')}{usingResend && t('fromEmailOnDomain')}</label>
                <input type="email" className="form-input"
                  placeholder={usingResend ? 'you@ag-development.dev' : 'you@yourdomain.com'}
                  value={conn.fromEmail} onChange={e => setConn({ ...conn, fromEmail: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
              <button onClick={saveConnection} disabled={connBusy}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm text-white rounded-lg disabled:opacity-60"
                style={{ background: '#0f1f3d' }}>
                {connBusy ? <><Spinner size="sm" /> {tc('saving')}</> : t('saveConnection')}
              </button>
              <button onClick={testConnection} disabled={connTesting} className="btn-ghost px-5">
                {connTesting ? t('sendingTest') : t('sendTestEmail')}
              </button>
            </div>
          </div>
        )}

        <div className="card p-7">
          <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
            {t('changePassword')}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {t('changePasswordDesc')}
          </p>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="form-label">{t('currentPassword')}</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder={t('currentPasswordPlaceholder')}
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showCurrent ? t('hide') : t('show')}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div>
                <label className="form-label">{t('newPassword')}</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder={t('newPasswordPlaceholder')}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    {showNew ? t('hide') : t('show')}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={t('confirmPlaceholder')}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirmPass && newPass !== confirmPass && (
                  <p className="form-error">{t('passwordsDoNotMatch')}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || (!!confirmPass && newPass !== confirmPass)}
                className="btn-secondary btn flex items-center gap-2"
              >
                {loading ? <><Spinner size="sm" /> {t('updating')}</> : t('updatePassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  )
}
