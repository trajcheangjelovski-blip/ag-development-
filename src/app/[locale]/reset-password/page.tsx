'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Spinner, Alert } from '@/components/ui'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Ensure the recovery link established a session before allowing a reset.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('This reset link is invalid or has expired. Please request a new one.')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/portal/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-base" style={{ background: '#0f1f3d' }}>AG</div>
            <span className="font-display font-bold text-lg text-slate-800">AG Development</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-2">Set New Password</h1>
          <p className="text-sm text-slate-500">Choose a strong password for your account</p>
        </div>

        <div className="card p-8 shadow-lg">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Password Updated!</h3>
              <p className="text-sm text-slate-500">Redirecting you to your portal...</p>
            </div>
          ) : (
            <>
              {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg disabled:opacity-70"
                  style={{ background: '#0f1f3d' }}
                >
                  {loading ? <><Spinner size="sm" /> Updating...</> : 'Set New Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
