'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Spinner } from '@/components/ui'

const SERVICES = [
  { label: 'Website development', desc: 'A new WordPress, Shopify, or business website built from scratch.' },
  { label: 'Website care & hosting', desc: 'Hosting, backups, security updates, and monthly site maintenance.' },
  { label: 'L1 IT support', desc: 'Day-to-day tech help for your team — passwords, software, printers, email.' },
  { label: 'Business email setup', desc: 'Microsoft 365 or Google Workspace setup, mailboxes, and troubleshooting.' },
  { label: 'Domain, DNS & SSL', desc: 'Domain connection, DNS records, SSL certificates, and redirects.' },
  { label: 'Social media & design', desc: 'Monthly branded posts, stories, and graphics for your channels.' },
  { label: 'One-time graphic design', desc: 'Logos, flyers, banners, business cards, and promo materials.' },
  { label: 'Custom platform / web app', desc: 'Client portals, booking systems, dashboards, and internal tools.' },
  { label: 'Not sure yet', desc: 'No problem — we\'ll recommend the right mix after reviewing your needs.' },
]

const FREQUENCIES = ['Occasionally', 'Weekly', 'Monthly', 'Daily']

const BUDGETS = ['Under $150/month', '$150–$300/month', '$300–$600/month', '$600+/month', 'Not sure']

const WORKSPACE_OPTIONS = ['Microsoft 365', 'Google Workspace', 'Both', 'Neither', 'Not sure']

const CONTACT_METHODS = ['Email', 'Phone', 'Either']

const STEP_LABELS = ['Services', 'Your Business', 'Budget & Contact']

export default function CustomPlanPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [services, setServices] = useState<string[]>([])
  const [biz, setBiz] = useState({
    businessName: '',
    website: '',
    employees: '',
    users: '',
    workspace: '',
    frequency: '',
  })
  const [contact, setContact] = useState({
    budget: '',
    name: '',
    email: '',
    phone: '',
    method: '',
    message: '',
  })

  function toggleService(s: string) {
    setServices(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]))
  }

  function next() {
    setError('')
    if (step === 1 && services.length === 0) {
      setError('Please select at least one service (or "Not sure yet").')
      return
    }
    if (step === 2 && !biz.businessName.trim()) {
      setError('Please enter your business name.')
      return
    }
    setStep(s => Math.min(3, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    setError('')
    setStep(s => Math.max(1, s - 1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!contact.budget) { setError('Please select a monthly budget range.'); return }
    if (!contact.name.trim()) { setError('Please enter your name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) { setError('Please enter a valid email address.'); return }

    const detailLines = [
      `— Custom Plan Request —`,
      `Employees: ${biz.employees || 'Not provided'}`,
      `Computers/users needing support: ${biz.users || 'Not provided'}`,
      `Microsoft 365 / Google Workspace: ${biz.workspace || 'Not provided'}`,
      `Support frequency: ${biz.frequency || 'Not provided'}`,
      `Preferred contact method: ${contact.method || 'Not provided'}`,
      contact.message ? `\nMessage:\n${contact.message}` : '',
    ].filter(Boolean)

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: biz.businessName.trim(),
          website: biz.website.trim() || null,
          full_name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim() || null,
          help_type: services.join(', '),
          budget: contact.budget,
          message: detailLines.join('\n'),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Build a Custom Monthly Plan for Your Business
          </h1>
          <p className="text-white/65 text-lg leading-relaxed">
            Choose the services your business needs and we&apos;ll prepare a custom support package based on your team, workload, and budget.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50 min-h-[60vh]">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            /* ── Thank-you ── */
            <div className="card p-10 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-3">
                Thank you! We received your request.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
                We&apos;ll review your business needs and prepare a custom support plan for you. You can expect a response within 24–48 hours.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}
              >
                Book a Free Consultation →
              </Link>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-0 mb-10">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-display font-extrabold text-sm transition-all"
                        style={
                          step > i + 1
                            ? { background: '#16a34a', color: 'white' }
                            : step === i + 1
                              ? { background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white' }
                              : { background: '#e2e8f0', color: '#94a3b8' }
                        }
                      >
                        {step > i + 1 ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs font-semibold ${step === i + 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className="w-16 sm:w-24 h-[2px] mx-3 mb-6" style={{ background: step > i + 1 ? '#16a34a' : '#e2e8f0' }} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="card p-8">
                {/* ── Step 1: Services ── */}
                {step === 1 && (
                  <>
                    <h2 className="font-display text-xl font-extrabold text-slate-800 mb-1">
                      Step 1: What do you need help with?
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Select everything that applies.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SERVICES.map(s => {
                        const checked = services.includes(s.label)
                        return (
                          <label
                            key={s.label}
                            className="flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all"
                            style={
                              checked
                                ? { borderColor: '#2563eb', background: '#eff6ff' }
                                : { borderColor: '#e2e8f0', background: 'white' }
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(s.label)}
                              className="w-4 h-4 accent-blue-600 flex-shrink-0 mt-0.5"
                            />
                            <span>
                              <span className="block text-sm font-semibold" style={{ color: checked ? '#1d4ed8' : '#1e293b' }}>
                                {s.label}
                              </span>
                              <span className="block text-xs leading-relaxed mt-0.5" style={{ color: checked ? '#3b82f6' : '#94a3b8' }}>
                                {s.desc}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* ── Step 2: Business ── */}
                {step === 2 && (
                  <>
                    <h2 className="font-display text-xl font-extrabold text-slate-800 mb-1">
                      Step 2: Tell us about your business
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">This helps us size your plan correctly.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Business name *</label>
                        <input className="form-input" placeholder="Your business name" value={biz.businessName} onChange={e => setBiz(p => ({ ...p, businessName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">Website URL (if you have one)</label>
                        <input className="form-input" placeholder="https://yourbusiness.com" value={biz.website} onChange={e => setBiz(p => ({ ...p, website: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Number of employees</label>
                          <input type="number" min="1" className="form-input" placeholder="e.g. 8" value={biz.employees} onChange={e => setBiz(p => ({ ...p, employees: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Computers/users needing support</label>
                          <input type="number" min="0" className="form-input" placeholder="e.g. 5" value={biz.users} onChange={e => setBiz(p => ({ ...p, users: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Do you use Microsoft 365 / Google Workspace?</label>
                        <select className="form-input" value={biz.workspace} onChange={e => setBiz(p => ({ ...p, workspace: e.target.value }))}>
                          <option value="">Select an option</option>
                          {WORKSPACE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">How often do you need support?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {FREQUENCIES.map(f => (
                            <label
                              key={f}
                              className="flex items-center justify-center px-3 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all"
                              style={
                                biz.frequency === f
                                  ? { borderColor: '#2563eb', background: '#eff6ff', color: '#1d4ed8' }
                                  : { borderColor: '#e2e8f0', background: 'white', color: '#374151' }
                              }
                            >
                              <input type="radio" name="frequency" className="sr-only" checked={biz.frequency === f} onChange={() => setBiz(p => ({ ...p, frequency: f }))} />
                              {f}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 3: Budget & contact ── */}
                {step === 3 && (
                  <>
                    <h2 className="font-display text-xl font-extrabold text-slate-800 mb-1">
                      Step 3: Budget and contact details
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Almost done — how can we reach you?</p>
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Monthly budget range *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {BUDGETS.map(b => (
                            <label
                              key={b}
                              className="flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer text-sm font-medium transition-all"
                              style={
                                contact.budget === b
                                  ? { borderColor: '#2563eb', background: '#eff6ff', color: '#1d4ed8' }
                                  : { borderColor: '#e2e8f0', background: 'white', color: '#374151' }
                              }
                            >
                              <input type="radio" name="budget" className="w-4 h-4 accent-blue-600" checked={contact.budget === b} onChange={() => setContact(p => ({ ...p, budget: b }))} />
                              {b}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Name *</label>
                          <input className="form-input" placeholder="Your full name" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Email *</label>
                          <input type="email" className="form-input" placeholder="you@business.com" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Phone number</label>
                          <input type="tel" className="form-input" placeholder="(555) 123-4567" value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div>
                          <label className="form-label">Preferred contact method</label>
                          <select className="form-input" value={contact.method} onChange={e => setContact(p => ({ ...p, method: e.target.value }))}>
                            <option value="">Select an option</option>
                            {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Message / extra details</label>
                        <textarea className="form-input min-h-28 resize-none" placeholder="Anything else we should know about your business or what you need?" value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))} />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="mt-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                  {step > 1 ? (
                    <button type="button" onClick={back} className="btn-ghost">
                      ← Back
                    </button>
                  ) : <span />}
                  {step < 3 ? (
                    <button type="button" onClick={next} className="btn-primary px-8">
                      Continue →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-70"
                      style={{ background: '#2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
                    >
                      {loading ? <><Spinner size="sm" /> Sending...</> : 'Request My Custom Plan →'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
