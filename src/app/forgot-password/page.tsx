'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Spinner, Alert } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-base" style={{ background: '#0f1f3d' }}>AG</div>
            <span className="font-display font-bold text-lg text-slate-800">AG Development</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-2">Reset Your Password</h1>
          <p className="text-sm text-slate-500">Enter your email and we'll send a reset link</p>
        </div>

        <div className="card p-8 shadow-lg">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Check Your Email</h3>
              <p className="text-sm text-slate-500 mb-4">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link.
              </p>
              <p className="text-xs text-slate-400">Didn't receive it? Check spam or <button className="text-blue-600 underline" onClick={() => setSent(false)}>try again</button>.</p>
            </div>
          ) : (
            <>
              {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@business.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-70"
                  style={{ background: '#0f1f3d' }}
                >
                  {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Reset Link →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 hover:underline">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
