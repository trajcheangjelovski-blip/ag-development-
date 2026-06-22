'use client'
import { useState, useRef } from 'react'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Spinner, Alert } from '@/components/ui'

const Field = ({ error, label, req, children }: { error?: string; label: string; req?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="form-label">{label}{req && <span className="text-red-500 ml-1">*</span>}</label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
)

export default function ReviewPage() {
  const [form, setForm] = useState({
    business_name: '', website: '', full_name: '', email: '', phone: '', about: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, logo: 'Please upload an image file (PNG, JPG, SVG, WebP)' }))
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrors(p => ({ ...p, logo: 'File too large. Maximum 50MB.' }))
      return
    }
    setErrors(p => ({ ...p, logo: '' }))
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.business_name.trim()) e.business_name = 'Required'
    if (!form.full_name.trim()) e.full_name = 'Required'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.about.trim()) e.about = 'Please tell us about you and your business'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')

    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    if (logoFile) data.append('logo', logoFile)

    try {
      const res = await fetch('/api/review', { method: 'POST', body: data })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Something went wrong. Please try again.')
      }
      setSubmitted(true)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const f = (id: keyof typeof form) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<any>) => {
      setForm(p => ({ ...p, [id]: e.target.value }))
      setErrors(p => ({ ...p, [id]: '' }))
    },
  })

  return (
    <>
      <PublicHeader />
      <section className="text-white text-center py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-4xl font-extrabold mb-4">See a Demo of Your Website for Your Business</h1>
          <p className="text-white/75 text-lg">Fill out this form and we&apos;ll build a free custom demo for your business and send it over — at no cost, no commitment.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div className="card p-12 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-3">Request Submitted!</h2>
              <p className="text-slate-500 leading-relaxed">
                Thanks, {form.full_name}! We&apos;re working on it — your website design will be sent to <strong className="text-slate-700">{form.email}</strong> within the next 24 hours.
              </p>
            </div>
          ) : (
            <div className="card p-8">
              {/* 24h promise banner */}
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
              >
                <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm leading-relaxed" style={{ color: '#1d4ed8' }}>
                  <strong>Free website design in 24 hours.</strong> Upload your logo and tell us about your business — we&apos;ll send a custom website design to your email within the next 24 hours.
                </p>
              </div>

              {apiError && <div className="mb-5"><Alert type="error" message={apiError} /></div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo upload */}
                <Field error={errors.logo} label="Your Business Logo">
                  {logoPreview ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200 p-1" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{logoFile?.name}</div>
                        <div className="text-xs text-slate-400">{logoFile ? `${(logoFile.size / 1024).toFixed(0)} KB` : ''}</div>
                      </div>
                      <button type="button" onClick={removeLogo} className="text-xs font-semibold text-red-500 hover:text-red-600 flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600">Click to upload your logo</span>
                      <span className="text-xs text-slate-400">PNG, JPG, SVG or WebP — max 50MB</span>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field error={errors.full_name} label="Your Name" req>
                    <input className={`form-input ${errors.full_name ? 'form-input-error' : ''}`} placeholder="Your name" {...f('full_name')} />
                  </Field>
                  <Field error={errors.email} label="Email Address" req>
                    <input type="email" className={`form-input ${errors.email ? 'form-input-error' : ''}`} placeholder="you@business.com" {...f('email')} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field error={errors.business_name} label="Business Name" req>
                    <input className={`form-input ${errors.business_name ? 'form-input-error' : ''}`} placeholder="Your business name" {...f('business_name')} />
                  </Field>
                  <Field label="Phone (optional)">
                    <input type="tel" className="form-input" placeholder="555-000-0000" {...f('phone')} />
                  </Field>
                </div>
                <Field label="Current Website URL (if you have one)">
                  <input className="form-input" placeholder="yourwebsite.com" {...f('website')} />
                </Field>
                <Field error={errors.about} label="Tell us about you and your business" req>
                  <textarea
                    className={`form-input min-h-32 resize-none ${errors.about ? 'form-input-error' : ''}`}
                    placeholder="What does your business do? Who are your customers? What services or products do you offer? Any style or color preferences for your website?"
                    {...f('about')}
                  />
                </Field>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-semibold text-white rounded-lg transition-all disabled:opacity-70"
                  style={{ background: '#0f1f3d' }}>
                  {loading ? <><Spinner size="sm" /> Submitting...</> : 'Get My Free Website Design →'}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Your website design will be delivered to your email within 24 hours. No cost, no commitment.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </>
  )
}
