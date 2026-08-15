'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'

export default function AccountSettings() {
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
      if (!res.ok) throw new Error(data?.error || 'Could not save')
      setConnMsg({ ok: true, text: 'Email connection saved.' })
      if (connPass.trim()) { setPasswordSet(true); setConnPass('') }
    } catch (e) {
      setConnMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save' })
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
      if (!res.ok) throw new Error(data?.error || 'Test failed')
      setConnMsg({ ok: true, text: `Test email sent to ${data.to}. Check your inbox.` })
    } catch (e) {
      setConnMsg({ ok: false, text: e instanceof Error ? e.message : 'Test failed' })
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
      if (!res.ok) throw new Error(body?.error || 'Upload failed')
      setAvatarUrl(body.avatar_url)
      setAvatarMsg({ ok: true, text: 'Picture updated! It may take a moment to appear everywhere.' })
    } catch (err) {
      setAvatarMsg({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' })
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
      setAvatarMsg({ ok: true, text: 'Picture removed.' })
    } else {
      setAvatarMsg({ ok: false, text: 'Could not remove picture' })
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
      setError('New password must be at least 8 characters')
      return
    }
    if (newPass !== confirmPass) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setError('Not authenticated'); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPass,
    })

    if (signInErr) {
      setError('Current password is incorrect')
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

    setSuccess('Password updated successfully!')
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
    setLoading(false)
  }

  return (
    <PortalLayout>
      <div className="p-8 max-w-lg">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-1">Account Settings</h1>
        <p className="text-sm text-slate-500 mb-8">Manage your profile and portal login credentials</p>

        {/* Profile picture / logo */}
        <div className="card p-7 mb-6">
          <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
            Profile Picture / Logo
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Shown in the sidebar and on your activity. Use your photo or your business logo.
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
                {avatarBusy ? 'Working…' : avatarUrl ? 'Change Picture' : 'Upload Picture'}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={avatarBusy} />
              </label>
              {avatarUrl && (
                <button onClick={removeAvatar} disabled={avatarBusy} className="text-xs font-semibold text-red-500 hover:text-red-600">
                  Remove
                </button>
              )}
              <span className="text-xs text-slate-400 w-full">PNG, JPG, SVG or WebP — max 5MB</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="card p-7 mb-6">
            <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
              My Email Connection
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {usingResend
                ? <>Lead replies and composed/bulk emails go out from <strong>your own address on the verified domain</strong> (e.g. you@ag-development.dev), sent via Resend. Replies come back to your login email.</>
                : <>Lead replies and composed/bulk emails go out from <strong>your own mailbox</strong>. Enter your personal SMTP details. Your password is encrypted and never shown again.</>}
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
                    <label className="form-label">SMTP Host</label>
                    <input className="form-input" placeholder="smtp.office365.com"
                      value={conn.host} onChange={e => setConn({ ...conn, host: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Port</label>
                    <input type="number" className="form-input" placeholder="587"
                      value={conn.port} onChange={e => setConn({ ...conn, port: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={conn.secure}
                        onChange={e => setConn({ ...conn, secure: e.target.checked })} />
                      Use SSL/TLS (port 465)
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Username</label>
                    <input className="form-input" placeholder="you@yourdomain.com" autoComplete="off"
                      value={conn.user} onChange={e => setConn({ ...conn, user: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" autoComplete="new-password"
                      placeholder={passwordSet ? '•••••••• (saved) — enter new to replace' : 'Mailbox or app password'}
                      value={connPass} onChange={e => setConnPass(e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <label className="form-label">From Name</label>
                <input className="form-input" placeholder="Your Name"
                  value={conn.fromName} onChange={e => setConn({ ...conn, fromName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">From Email{usingResend && ' (on ag-development.dev)'}</label>
                <input type="email" className="form-input"
                  placeholder={usingResend ? 'you@ag-development.dev' : 'you@yourdomain.com'}
                  value={conn.fromEmail} onChange={e => setConn({ ...conn, fromEmail: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
              <button onClick={saveConnection} disabled={connBusy}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm text-white rounded-lg disabled:opacity-60"
                style={{ background: '#0f1f3d' }}>
                {connBusy ? <><Spinner size="sm" /> Saving…</> : 'Save Connection'}
              </button>
              <button onClick={testConnection} disabled={connTesting} className="btn-ghost px-5">
                {connTesting ? 'Sending test…' : 'Send Test Email'}
              </button>
            </div>
          </div>
        )}

        <div className="card p-7">
          <h2 className="font-display font-bold text-slate-800 mb-1" style={{ fontSize: 16 }}>
            Change Password
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Enter your current password, then choose a new one.
          </p>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Your current password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="At least 8 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat your new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirmPass && newPass !== confirmPass && (
                  <p className="form-error">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || (!!confirmPass && newPass !== confirmPass)}
                className="btn-secondary btn flex items-center gap-2"
              >
                {loading ? <><Spinner size="sm" /> Updating…</> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  )
}
