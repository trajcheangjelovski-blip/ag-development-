'use client'
import { useState } from 'react'
import { Spinner, Alert } from '@/components/ui'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let out = ''
  const arr = new Uint32Array(14)
  crypto.getRandomValues(arr)
  arr.forEach(n => { out += chars[n % chars.length] })
  return out
}

// Admin: set a new portal password for a client who forgot theirs.
export function ResetClientPasswordButton({ clientId, clientEmail }: { clientId: string; clientEmail: string }) {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  function open() {
    setPassword(generatePassword())
    setError('')
    setDone(false)
    setCopied(false)
    setShowModal(true)
  }

  async function reset() {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setBusy(true)
    setError('')
    const res = await fetch(`/api/clients/${clientId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Failed to reset password')
    }
    setBusy(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <>
      <button className="btn-ghost text-sm" onClick={open}>🔑 Reset Password</button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && !busy && setShowModal(false)}
        >
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-slate-800">Reset client password</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {done ? (
              <>
                <Alert type="success" message="Password reset successfully!" />
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">New password for {clientEmail}:</div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="font-mono text-sm font-bold text-slate-800 break-all">{password}</code>
                    <button onClick={copy} className="btn-ghost text-xs flex-shrink-0">
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Share this with the client securely. They can change it afterwards in Account Settings.
                </p>
                <div className="flex justify-end mt-5">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Done</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  Set a new portal password for <strong>{clientEmail}</strong>. Their current password stops working immediately.
                </p>
                {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
                <label className="form-label">New password</label>
                <div className="flex gap-2 mb-5">
                  <input
                    className="form-input font-mono"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setPassword(generatePassword())} className="btn-ghost text-xs flex-shrink-0" title="Generate new">
                    🎲
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setShowModal(false)} disabled={busy}>Cancel</button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold text-sm hover:bg-slate-700 transition-all disabled:opacity-60"
                    onClick={reset}
                    disabled={busy || password.length < 8}
                  >
                    {busy ? <><Spinner size="sm" /> Resetting…</> : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
