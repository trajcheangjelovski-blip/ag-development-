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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      if (data) {
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
