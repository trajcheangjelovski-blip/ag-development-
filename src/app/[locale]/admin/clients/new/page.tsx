'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { Alert, Spinner } from '@/components/ui'
import Link from 'next/link'

export default function AdminNewClient() {
  const router = useRouter()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [success, setSuccess] = useState<{ email: string; name: string } | null>(null)
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    password: '',
    phone: '',
    website: '',
    package_id: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/packages').then(r => r.json()).then(setPackages)
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.business_name) e.business_name = 'Required'
    if (!form.contact_name) e.contact_name = 'Required'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.password) e.password = 'Required'
    if (form.password && form.password.length < 8) e.password = 'Must be at least 8 characters'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create client')
      setLoading(false)
      return
    }

    setSuccess({ email: form.email, name: form.contact_name })
    setLoading(false)
  }

  const f = (id: keyof typeof form) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<any>) => {
      setForm(p => ({ ...p, [id]: e.target.value }))
      setErrors(p => ({ ...p, [id]: '' }))
    },
  })

  if (success) {
    return (
      <PortalLayout>
        <div className="p-8 max-w-lg">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-display text-xl font-extrabold text-slate-800 mb-2">Client Created!</h2>
            <p className="text-slate-500 text-sm mb-6">
              An invite email was sent to <strong>{success.email}</strong> with their login details.
            </p>
            <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Client portal access
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Login URL</span>
                  <span className="font-medium text-blue-600">{process.env.NEXT_PUBLIC_APP_URL}/login</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <strong>{success.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password</span>
                  <strong>The one you set</strong>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button className="btn-ghost btn" onClick={() => router.push('/admin/clients')}>
                Back to Clients
              </button>
              <button className="btn-secondary btn" onClick={() => {
                setSuccess(null)
                setForm({ business_name:'',contact_name:'',email:'',password:'',phone:'',website:'',package_id:'',notes:'' })
              }}>
                Add Another Client
              </button>
            </div>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="p-8">
        <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5">
          ← Back to Clients
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-1">Add New Client</h1>
        <p className="text-sm text-slate-500 mb-6">
          Fill in the client's details and set their portal password. They'll receive an email with login instructions.
        </p>

        <div className="card p-7 max-w-xl">
          {error && <div className="mb-5"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Business info */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Business Info
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="form-label">Business Name <span className="text-red-500">*</span></label>
                  <input className={`form-input ${errors.business_name ? 'form-input-error' : ''}`} placeholder="Business name" {...f('business_name')} />
                  {errors.business_name && <p className="form-error">{errors.business_name}</p>}
                </div>
                <div>
                  <label className="form-label">Contact Name <span className="text-red-500">*</span></label>
                  <input className={`form-input ${errors.contact_name ? 'form-input-error' : ''}`} placeholder="Full name" {...f('contact_name')} />
                  {errors.contact_name && <p className="form-error">{errors.contact_name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="555-000-0000" type="tel" {...f('phone')} />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input className="form-input" placeholder="website.com" {...f('website')} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Login credentials */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Portal Login Credentials
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
                <strong>How this works:</strong> Enter the client's email and set their password below. They'll use these exact credentials to log into the client portal. An invite email will be sent to them automatically.
              </div>
              <div className="mb-3">
                <label className="form-label">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="client@theirbusiness.com"
                  autoComplete="off"
                  {...f('email')}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div>
                <label className="form-label">Portal Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                    placeholder="Set their login password (min. 8 characters)"
                    autoComplete="new-password"
                    {...f('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  The client will use this password to log in. They can change it at any time from their profile.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Plan */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Support Plan
              </div>
              <div>
                <label className="form-label">Package</label>
                <select className="form-input" {...f('package_id')}>
                  <option value="">Select a package…</option>
                  {packages.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price}/month ({p.requests_per_month} req · {p.hours_per_month}h)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">Internal Notes</label>
              <textarea
                className="form-input"
                style={{ minHeight: 70, resize: 'vertical' }}
                placeholder="Notes about this client (only visible to admins)…"
                {...f('notes')}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn-ghost btn" onClick={() => router.push('/admin/clients')}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-secondary btn flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <><Spinner size="sm" /> Creating…</> : 'Create Client & Send Invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  )
}
