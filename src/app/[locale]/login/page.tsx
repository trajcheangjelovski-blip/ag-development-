'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Alert, Spinner } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Get role to redirect correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-base" style={{ background: '#0f1f3d' }}>AG</div>
            <span className="font-display font-bold text-lg text-slate-800">AG Development</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-2">Sign In to Your Portal</h1>
          <p className="text-sm text-slate-500">Access your support dashboard and tickets</p>
        </div>

        <div className="card p-8 shadow-lg">
          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
            <div>
              <div className="flex items-center justify-between">
                <label className="form-label">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-70"
              style={{ background: '#0f1f3d' }}
            >
              {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">← Back to Website</Link>
        </p>
      </div>
    </div>
  )
}
