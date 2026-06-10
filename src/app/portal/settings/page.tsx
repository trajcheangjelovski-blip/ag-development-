'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'

export default function AccountSettings() {
  const supabase = createClient()
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
        <p className="text-sm text-slate-500 mb-8">Manage your portal login credentials</p>

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
