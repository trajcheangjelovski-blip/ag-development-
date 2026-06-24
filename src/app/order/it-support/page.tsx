'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { usePlans } from '@/lib/usePlans'

// ── Data ──────────────────────────────────────────────────────────────────────

const IT_PLANS = [
  {
    id: 'basic',
    name: 'L1 Basic Support', price: 49, icon: '🖥️', badge: 'Starter', popular: false,
    description: 'First-level tech support for very small teams. We handle everyday computer problems so your team can stay focused.',
    goodFor: 'Solo operators and 1–2 person teams that occasionally hit tech roadblocks.',
    features: [
      '3 support tickets per month',
      'Up to 2 team members covered',
      'Password reset assistance',
      'Browser & software troubleshooting',
      'Printer & scanner help',
      'Basic internet connectivity checks',
      'Email support channel',
      'Remote support (limited sessions)',
    ],
  },
  {
    id: 'team',
    name: 'L1 Team Support', price: 99, icon: '👥', badge: 'Most Popular', popular: true,
    description: "Full remote support for small teams. We connect directly to your team's computers and fix issues on the spot.",
    goodFor: 'Teams of 2–5 people who deal with regular tech problems — printers, email setups, slow computers, software crashes.',
    features: [
      '8 support tickets per month',
      'Up to 5 team members covered',
      'Full remote desktop support',
      'Windows OS troubleshooting',
      'Email & Outlook issues',
      'Browser problems fixed',
      'Software installation help',
      'Printer, scanner & peripheral help',
      'Escalation notes for complex issues',
    ],
  },
  {
    id: 'office',
    name: 'L1 Office Support', price: 179, icon: '🏢', badge: 'Full Coverage', popular: false,
    description: 'The most comprehensive IT support plan. Priority response, up to 10 users covered, and a monthly report.',
    goodFor: 'Small offices of 5–10 staff where tech issues happen regularly and downtime costs you money.',
    features: [
      '15 support tickets per month',
      'Up to 10 team members covered',
      'Full remote desktop support',
      'Priority response time',
      'Monthly IT issue summary report',
      'Basic device troubleshooting',
      'Windows & software support',
      'All L1 Team features included',
      'Escalation guidance for complex issues',
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeStyle(badge: string, selected: boolean): CSSProperties {
  if (selected) return { background: '#2563eb', color: 'white' }
  if (badge === 'Most Popular') return { background: '#dbeafe', color: '#1d4ed8' }
  if (badge === 'Full Coverage') return { background: '#dcfce7', color: '#166534' }
  return { background: '#f1f5f9', color: '#64748b' }
}

function StepBar({ step, mobile }: { step: number; mobile: boolean }) {
  const labels = ['Choose Plan', 'Your Details']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '40px' }}>
      {labels.map((label, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: mobile ? '70px' : '130px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: done ? '#0f1f3d' : active ? '#2563eb' : '#e2e8f0',
                color: (done || active) ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{ fontSize: '11px', fontWeight: active ? 700 : 400, color: active ? '#0f1f3d' : '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ width: '60px', height: '2px', background: num < step ? '#0f1f3d' : '#e2e8f0', margin: '17px 6px 0', flexShrink: 0, transition: 'background 0.2s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ITSummary({ plan }: { plan: typeof IT_PLANS[0] }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f1f3d', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        Order Summary
      </h3>
      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', margin: '0 0 10px' }}>IT Support Plan — Monthly</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f1f3d' }}>{plan.name}</span>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#2563eb' }}>${plan.price}/mo</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 14px' }}>
        {plan.features.slice(0, 3).map(f => (
          <li key={f} style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7, display: 'flex', gap: '6px' }}>
            <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
          </li>
        ))}
        <li style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.7, paddingLeft: '14px' }}>+ {plan.features.length - 3} more included</li>
      </ul>
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Monthly Total</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>${plan.price}/mo</span>
        </div>
      </div>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#1e40af', lineHeight: 1.6 }}>
        🔒 <strong>Secure checkout via Stripe.</strong> You&apos;ll enter payment on the next step. Cancel your subscription anytime.
      </div>
    </div>
  )
}

// ── Main content (uses useSearchParams — needs Suspense) ──────────────────────

function ITOrderContent() {
  const searchParams = useSearchParams()
  const initialPlan = searchParams.get('plan') || 'team'

  const [step, setStep] = useState(1)
  const [mobile, setMobile] = useState(false)
  const [tablet, setTablet] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ businessName: '', fullName: '', email: '', phone: '', teamSize: '', message: '' })
  const [coupon, setCoupon] = useState('')

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setMobile(w < 640)
      setTablet(w >= 640 && w < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isDesktop = !mobile && !tablet

  // Live prices from the admin panel (/api/plans). Admin plan IDs are prefixed
  // with "it-" (e.g. it-basic), so match against `it-${p.id}` and override the
  // hard-coded fallback price with the admin-managed effective price.
  const apiPlans = usePlans()
  const itPlans = IT_PLANS.map(p => {
    const api = apiPlans.find(x => x.id === `it-${p.id}`)
    return api ? { ...p, price: api.effective_price } : p
  })

  const plan = itPlans.find(p => p.id === selectedPlan) ?? itPlans[1]

  function goTo(n: number) { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.businessName.trim()) e.businessName = 'Required'
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError('')
    try {
      // Capture details as a lead (best-effort — don't block checkout)
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.businessName.trim(),
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          help_type: `IT Support Only: ${plan.name} ($${plan.price}/month)`,
          budget: plan.price,
          message: [
            form.teamSize ? `Team size: ${form.teamSize}` : '',
            form.message,
          ].filter(Boolean).join('\n') || undefined,
        }),
      }).catch(() => {})

      // Send the customer to Stripe Checkout for the selected plan
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [`it-${plan.id}`], coupon_code: coupon.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setApiError(data.error || 'Could not start checkout. Please try again.')
      setLoading(false)
    } catch {
      setApiError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const inputStyle: CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f1f3d', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', display: 'block' }
  const inputError: CSSProperties = { ...inputStyle, border: '1.5px solid #f87171' }
  const label: CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const btnPrimary: CSSProperties = { background: '#0f1f3d', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box' }
  const btnBack: CSSProperties = { background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }

  // ── Success ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ minHeight: '80vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: mobile ? '40px 24px' : '60px 48px', textAlign: 'center', maxWidth: '580px', width: '100%' }}>
          <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '20px' }}>🎉</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 10px' }}>Order Received!</h1>
          <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 32px' }}>
            Thank you, {submittedName}! We&apos;ll review your order and contact you within <strong style={{ color: '#0f1f3d' }}>1 business day</strong>.
          </p>
          <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '0 0 16px' }}>What happens next</p>
            {[
              'We review your order and reach out to confirm',
              'We verify the number of team members and devices',
              'You receive your support ticket portal access',
              'Support begins within 1–2 business days',
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 3 ? '12px' : 0 }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ display: 'inline-block', background: '#0f1f3d', color: 'white', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back to Home</Link>
            <Link href="/contact" style={{ display: 'inline-block', background: '#f1f5f9', color: '#374151', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Contact Us</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: mobile ? '20px 16px' : tablet ? '28px 20px' : '40px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '12px', color: '#94a3b8' }}>
          <Link href="/order" style={{ color: '#94a3b8', textDecoration: 'none' }}>Order</Link>
          <span>›</span>
          <span style={{ color: '#475569', fontWeight: 500 }}>IT Support Only</span>
        </div>

        <StepBar step={step} mobile={mobile} />

        {/* ── Step 1: Choose Plan ───────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', margin: '0 0 10px' }}>Step 1 of 2</p>
              <h1 style={{ fontSize: mobile ? '24px' : '28px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 10px' }}>Choose Your IT Support Plan</h1>
              <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Monthly support for your team. No website required.</p>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#1e40af', lineHeight: 1.6 }}>
              💡 <strong>First-level support only.</strong> We handle passwords, software, printers, browser problems, and basic connectivity. Complex server or network issues are quoted separately. Extra tickets available at $10/ticket.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {itPlans.map(p => {
                const sel = selectedPlan === p.id
                const hov = hoveredPlan === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    onMouseEnter={() => setHoveredPlan(p.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    style={{
                      background: sel ? '#f8faff' : hov ? '#fafcff' : 'white',
                      border: `2px solid ${sel ? '#2563eb' : hov ? '#93c5fd' : '#e2e8f0'}`,
                      boxShadow: sel ? '0 0 0 4px rgba(37,99,235,0.1), 0 8px 24px rgba(37,99,235,0.12)' : hov ? '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.06)',
                      transform: sel ? 'translateY(-3px)' : hov ? 'translateY(-4px)' : 'translateY(0px)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '16px',
                      padding: mobile ? '16px' : tablet ? '20px' : '28px 32px',
                      cursor: 'pointer',
                      position: 'relative',
                      minHeight: mobile ? 'auto' : tablet ? '170px' : '200px',
                      boxSizing: 'border-box',
                      display: mobile ? 'block' : 'flex',
                      gap: mobile ? undefined : tablet ? '16px' : '20px',
                    }}
                  >
                    {p.popular && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>★ Most Popular</div>
                    )}
                    {sel && (
                      <div style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: '4px', background: 'linear-gradient(180deg, #2563eb, #7c3aed)', borderRadius: '0 4px 4px 0' }} />
                    )}

                    {mobile ? (
                      /* ── Mobile: vertical stack ── */
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{p.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f1f3d', lineHeight: 1.2 }}>{p.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
                              <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>${p.price}</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>/mo</span>
                            </div>
                          </div>
                          <span style={{ ...badgeStyle(p.badge, sel), fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', flexShrink: 0, whiteSpace: 'nowrap' }}>{p.badge}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, margin: '0 0 10px' }}>{p.description}</p>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: '7px' }}>What&apos;s included</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
                          {p.features.map(f => (
                            <li key={f} style={{ fontSize: '12px', color: '#374151', lineHeight: 1.7, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5, margin: 0, paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <strong style={{ fontStyle: 'normal', fontWeight: 600, color: '#64748b' }}>Good for:</strong> {p.goodFor}
                        </p>
                      </>
                    ) : (
                      /* ── Tablet / Desktop: two columns ── */
                      <>
                        <div style={{ width: tablet ? '145px' : '180px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: tablet ? '28px' : '32px', lineHeight: 1, marginBottom: '8px' }}>{p.icon}</div>
                          <div style={{ fontSize: tablet ? '16px' : '18px', fontWeight: 700, color: '#0f1f3d', marginBottom: '6px', lineHeight: 1.3 }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
                            <span style={{ fontSize: tablet ? '20px' : '24px', fontWeight: 800, color: '#2563eb', display: 'inline-block', transition: 'transform 0.2s ease', transform: sel || hov ? 'scale(1.05)' : 'scale(1)' }}>${p.price}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>/mo</span>
                          </div>
                          <span style={{ ...badgeStyle(p.badge, sel), display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px', width: 'fit-content', marginBottom: '10px' }}>{p.badge}</span>
                          <p style={{ fontSize: tablet ? '12px' : '13px', color: '#64748b', lineHeight: 1.65, margin: '0 0 8px', flex: 1 }}>{p.description}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5, margin: 0, marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                            <strong style={{ fontStyle: 'normal', fontWeight: 600, color: '#64748b' }}>Good for:</strong> {p.goodFor}
                          </p>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: '12px' }}>What&apos;s included</div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {p.features.map(f => (
                              <li key={f} style={{ fontSize: tablet ? '12px' : '13px', color: '#374151', lineHeight: 1.85, display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <button onClick={() => goTo(2)} style={btnPrimary}>Continue → Your Details</button>
          </div>
        )}

        {/* ── Step 2: Your Details ──────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', margin: '0 0 10px' }}>Step 2 of 2</p>
              <h1 style={{ fontSize: mobile ? '24px' : '28px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 10px' }}>Your Details</h1>
              <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Almost done — we&apos;ll confirm your plan and reach out within 1 business day.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 300px' : '1fr', gap: '24px', alignItems: 'start' }}>
              {!isDesktop && <ITSummary plan={plan} />}

              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: mobile ? '20px 16px' : tablet ? '24px 20px' : '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={label}>Business Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={errors.businessName ? inputError : inputStyle} placeholder="e.g. Bloom Florist" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
                    {errors.businessName && <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{errors.businessName}</p>}
                  </div>
                  <div>
                    <label style={label}>Your Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={errors.fullName ? inputError : inputStyle} placeholder="e.g. Sarah Miller" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                    {errors.fullName && <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{errors.fullName}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={label}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" style={errors.email ? inputError : inputStyle} placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    {errors.email && <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{errors.email}</p>}
                  </div>
                  <div>
                    <label style={label}>Phone Number</label>
                    <input type="tel" style={inputStyle} placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={label}>Number of team members</label>
                  <input style={inputStyle} placeholder="e.g. 3 — helps us prepare your support plan" value={form.teamSize} onChange={e => setForm(f => ({ ...f, teamSize: e.target.value }))} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={label}>Message / Notes</label>
                  <textarea rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} placeholder="Any specific tech issues, software you use, devices, or requirements..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>

                <div style={{ marginBottom: apiError ? '16px' : 0 }}>
                  <label style={label}>Discount code (optional)</label>
                  <input style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} />
                </div>

                {apiError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#dc2626', lineHeight: 1.6 }}>{apiError}</div>}
              </div>

              {isDesktop && <div style={{ position: 'sticky', top: '80px' }}><ITSummary plan={plan} /></div>}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
              <button type="button" onClick={() => goTo(1)} style={btnBack}>← Back</button>
              <button type="submit" disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Redirecting to payment…' : 'Continue to Secure Payment →'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>
              🔒 Secure checkout powered by Stripe. Cancel anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function ITSupportOrderPage() {
  return (
    <>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f1f3d', letterSpacing: '-0.02em' }}>AG Development</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Need help?</span>
            <Link href="/contact" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Contact us</Link>
          </div>
        </div>
      </header>
      <Suspense fallback={<div style={{ minHeight: '80vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '14px', color: '#94a3b8' }}>Loading…</span></div>}>
        <ITOrderContent />
      </Suspense>
    </>
  )
}
