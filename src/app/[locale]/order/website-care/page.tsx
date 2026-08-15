'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePlanPriceMap } from '@/lib/usePlans'
import type { CSSProperties } from 'react'
import { regionFromLocale } from '@/i18n/routing'
import { formatPrice } from '@/lib/money'
import { Price } from '@/components/public/Price'

// ── Data ──────────────────────────────────────────────────────────────────────

const CARE_PLANS = [
  {
    id: 'basic-care',
    name: 'Basic Care', price: 29, icon: '🛡️', badge: 'Essential', popular: false,
    description: 'Simple website maintenance for businesses that want their site to stay online, secure, and updated.',
    goodFor: 'Businesses that rarely need changes and only want peace of mind that their website is safe.',
    features: [
      'Web hosting included',
      'Monthly automated backups',
      'Security & plugin updates',
      'Uptime monitoring',
      'Performance checks',
      'Email support',
    ],
    details: [
      { label: 'Monthly website updates', value: 'Not included' },
      { label: 'First response', value: 'Within 2 business days' },
    ],
  },
  {
    id: 'content-care',
    name: 'Content Care', price: 49, icon: '✏️', badge: 'Most Popular', popular: true,
    description: 'Website care plus small monthly content updates for businesses that need occasional changes.',
    goodFor: 'Restaurants, salons, repair shops, offices, and local businesses that update prices, photos, hours, or services a few times per month.',
    features: [
      'Web hosting included',
      'Everything in Basic Care',
      '30 min/month content updates',
      'Update text, images, prices, or hours',
      'Add or edit services',
      'Priority email support',
    ],
    details: [
      { label: 'Monthly website updates', value: '30 minutes included' },
      { label: 'First response', value: 'Within 1 business day' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ],
  },
  {
    id: 'growth-care',
    name: 'Growth Care', price: 100, icon: '🎨', badge: 'Updates + Design', popular: false,
    description: 'More monthly website support for businesses that update their website regularly.',
    goodFor: 'Growing businesses with weekly updates, new services, seasonal offers, or heavier content work.',
    features: [
      'Web hosting included',
      'Everything in Content Care',
      '1 hour/month website updates',
      'Add/edit services, photos, or new sections',
      'Minor layout improvements',
      'Priority support response',
    ],
    details: [
      { label: 'Monthly website updates', value: '1 hour included' },
      { label: 'First response', value: 'Within 8 business hours' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ],
  },
  {
    id: 'full-care',
    name: 'Full Care', price: 150, icon: '🚀', badge: 'Maximum Support', popular: false,
    description: 'Our most complete website care plan for active business websites.',
    goodFor: 'Offices, agencies, and multi-service businesses that treat their website as an active part of their business.',
    features: [
      'Web hosting included',
      'Everything in Growth Care',
      '2 hours/month website updates',
      'Priority response time',
      'Monthly update summary report',
      'Minor design improvements',
    ],
    details: [
      { label: 'Monthly website updates', value: '2 hours included' },
      { label: 'First response', value: 'Within 4 business hours' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ],
  },
]

const comparisonRows = [
  { feature: 'Web hosting',                basic: '✓',              content: '✓',              growth: '✓',              full: '✓',              type: 'check' },
  { feature: 'Monthly backups',            basic: '✓',              content: '✓',              growth: '✓',              full: '✓',              type: 'check' },
  { feature: 'Security & plugin updates',  basic: '✓',              content: '✓',              growth: '✓',              full: '✓',              type: 'check' },
  { feature: 'Uptime monitoring',          basic: '✓',              content: '✓',              growth: '✓',              full: '✓',              type: 'check' },
  { feature: 'Performance checks',         basic: '✓',              content: '✓',              growth: '✓',              full: '✓',              type: 'check' },
  { feature: 'Monthly website updates',    basic: '—',              content: '30 min',         growth: '1 hour',         full: '2 hours',        type: 'text' },
  { feature: 'Update text, images, prices',basic: '—',              content: '✓',              growth: '✓',              full: '✓',              type: 'check-partial' },
  { feature: 'Add or edit services',       basic: '—',              content: '✓',              growth: '✓',              full: '✓',              type: 'check-partial' },
  { feature: 'Add/edit photos or sections',basic: '—',              content: '—',              growth: '✓',              full: '✓',              type: 'check-partial' },
  { feature: 'Minor layout improvements',  basic: '—',              content: '—',              growth: '✓',              full: '✓',              type: 'check-partial' },
  { feature: 'Minor design improvements',  basic: '—',              content: '—',              growth: '—',              full: '✓',              type: 'check-partial' },
  { feature: 'Support channel',            basic: 'Email',          content: 'Priority email', growth: 'Priority',       full: 'Priority',       type: 'text' },
  { feature: 'First response',             basic: '2 bus. days',    content: '1 bus. day',     growth: '8 bus. hrs',     full: '4 bus. hrs',     type: 'text' },
  { feature: 'Monthly update report',      basic: '—',              content: '—',              growth: '—',              full: '✓',              type: 'check-partial' },
  { feature: 'Price',                      basic: '$29/mo',         content: '$49/mo',         growth: '$100/mo',        full: '$150/mo',        type: 'price' },
]

const PLATFORMS = ['WordPress', 'Shopify', 'Wix', 'Squarespace', 'Custom HTML', 'Not sure', 'Other']

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgeStyle(badge: string, selected: boolean): CSSProperties {
  if (selected) return { background: '#2563eb', color: 'white' }
  if (badge === 'Most Popular')     return { background: '#dbeafe', color: '#1d4ed8' }
  if (badge === 'Updates + Design') return { background: '#ede9fe', color: '#6d28d9' }
  if (badge === 'Maximum Support')  return { background: '#dcfce7', color: '#166534' }
  return { background: '#f1f5f9', color: '#64748b' }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WebsiteCarePage() {
  const [mobile,        setMobile]        = useState(false)
  const [tablet,        setTablet]        = useState(false)
  const [selectedPlan,  setSelectedPlan]  = useState<string | null>(null)
  const [hoveredPlan,   setHoveredPlan]   = useState<string | null>(null)
  const [submitted,     setSubmitted]     = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [apiError,      setApiError]      = useState('')
  const [errors,        setErrors]        = useState<Record<string, string>>({})
  const [platform,      setPlatform]      = useState('')
  const [form, setForm] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
  })

  const formRef     = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

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

  // Scroll to form on first plan selection
  useEffect(() => {
    if (selectedPlan && !hasScrolled.current && formRef.current) {
      hasScrolled.current = true
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [selectedPlan])

  // Live prices from the admin panel (card id already matches the catalog id)
  const priceMap = usePlanPriceMap()
  const CARE_PLANS_LIVE = useMemo(
    () => CARE_PLANS.map(p => {
      const live = priceMap[p.id]
      return live != null ? { ...p, price: live } : p
    }),
    [priceMap],
  )

  const plan = CARE_PLANS_LIVE.find(p => p.id === selectedPlan) ?? null

  const locale = useLocale()
  const region = regionFromLocale(locale)
  const fmt = (n: number) => formatPrice(n, region === 'mk' ? 'MKD' : 'USD', locale)
  const carePrice = (id: string) => {
    const pr = CARE_PLANS_LIVE.find(p => p.id === id)?.price
    return pr != null ? fmt(pr) : ''
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.businessName.trim()) e.businessName = 'Required'
    if (!form.fullName.trim())     e.fullName     = 'Required'
    if (!form.email.trim())        e.email        = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.website.trim())      e.website      = 'Required'
    if (!selectedPlan)             e.plan         = 'Please select a plan above'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!plan) return
    setLoading(true); setApiError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.businessName.trim(),
          full_name:     form.fullName.trim(),
          email:         form.email.trim(),
          phone:         form.phone.trim() || undefined,
          website:       form.website.trim(),
          help_type:     `Website Care Plan: ${plan.name} (${fmt(plan.price)}/month)${platform ? ` - Platform: ${platform}` : ''}`,
          budget:        plan.price,
          message:       form.notes.trim() || undefined,
          status:        'New',
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setApiError(d.error || 'Something went wrong. Please try again.')
      } else {
        setSubmittedName(form.fullName.split(' ')[0] || 'there')
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Shared styles ────────────────────────────────────────────────────────

  const inputStyle: CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', color: '#0f1f3d', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', display: 'block',
  }
  const inputErr: CSSProperties  = { ...inputStyle, border: '1.5px solid #f87171' }
  const lbl: CSSProperties        = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const btnPrimary: CSSProperties = {
    background: '#0f1f3d', color: 'white', border: 'none', borderRadius: '10px',
    padding: '15px 28px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box',
  }

  // ── Success screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <>
        <PageHeader />
        <div style={{ minHeight: '80vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: mobile ? '32px 20px' : '60px 48px', textAlign: 'center', maxWidth: '560px', width: '100%' }}>
            <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '16px' }}>🎉</div>
            <h1 style={{ fontSize: mobile ? '24px' : '28px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 10px' }}>You&apos;re all set!</h1>
            <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              Thank you, {submittedName}! We&apos;ve received your care plan request. We&apos;ll review your website and contact you within <strong style={{ color: '#0f1f3d' }}>1 business day</strong> to confirm compatibility and get you started.
            </p>

            {plan && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#16a34a', margin: '0 0 8px' }}>Your Selected Plan</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f1f3d' }}>{plan.icon} {plan.name}</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}><Price amount={plan.price} />/mo</span>
                </div>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: '6px 0 0' }}>🏠 Web hosting included</p>
              </div>
            )}

            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '0 0 14px' }}>What happens next</p>
              {[
                'We review your website for compatibility with our care plans',
                'We confirm your plan details and domain info',
                'We set up hosting, backups, and security monitoring',
                'Your care plan goes live within 1–2 business days',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: i < 3 ? '10px' : 0 }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/" style={{ display: 'inline-block', background: '#0f1f3d', color: 'white', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back to Home</Link>
              <Link href="/contact" style={{ display: 'inline-block', background: '#f1f5f9', color: '#374151', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Contact Us</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Main page ────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader />
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{
          maxWidth: '960px', margin: '0 auto',
          padding: mobile ? '20px 16px 56px' : tablet ? '32px 20px 64px' : '48px 24px 80px',
        }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '12px', color: '#94a3b8' }}>
            <Link href="/order" style={{ color: '#94a3b8', textDecoration: 'none' }}>Order</Link>
            <span>›</span>
            <span style={{ color: '#475569', fontWeight: 500 }}>Website Care Plans</span>
          </div>

          {/* Page title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: mobile ? '22px' : tablet ? '26px' : '30px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 10px' }}>Website Care Plans</h1>
            <p style={{ fontSize: mobile ? '14px' : '15px', color: '#64748b', margin: '0', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
              Already have a website? Choose a monthly care plan to keep it secure, updated, and running smoothly.
            </p>
          </div>

          {/* Green hosting info box */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 12, padding: mobile ? '14px 16px' : '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: mobile ? 13 : 14, color: '#166534', marginBottom: 3 }}>
                All Website Care Plans include web hosting
              </div>
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                No separate hosting bill. Only extra cost: your domain name, usually around $12/year.
              </div>
            </div>
          </div>

          {/* ── Plan error ── */}
          {errors.plan && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#dc2626', marginBottom: '16px' }}>
              {errors.plan}
            </div>
          )}

          {/* ── Plan cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
            gap: mobile ? '12px' : '16px',
            marginBottom: '40px',
          }}>
            {CARE_PLANS_LIVE.map(p => {
              const sel = selectedPlan === p.id
              const hov = hoveredPlan  === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  onMouseEnter={() => setHoveredPlan(p.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    background: sel ? '#f8faff' : hov ? '#fafcff' : 'white',
                    border: `2px solid ${sel ? '#2563eb' : hov ? '#93c5fd' : '#e2e8f0'}`,
                    boxShadow: sel
                      ? '0 0 0 4px rgba(37,99,235,0.10), 0 8px 24px rgba(37,99,235,0.12)'
                      : hov ? '0 8px 30px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transform: sel ? 'translateY(-3px)' : hov ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    borderRadius: '16px',
                    padding: mobile ? '16px' : tablet ? '20px' : '28px 32px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Recommended ribbon */}
                  {p.popular && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                      ★ Recommended
                    </div>
                  )}

                  {/* Left accent bar */}
                  {sel && (
                    <div style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: '4px', background: 'linear-gradient(180deg, #2563eb, #7c3aed)', borderRadius: '0 4px 4px 0' }} />
                  )}

                  {mobile ? (
                    /* ── Mobile: vertical compact layout ── */
                    <>
                      {/* Header row: icon + name + price */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{p.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f1f3d', lineHeight: 1.2 }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
                            <span style={{ fontSize: '21px', fontWeight: 800, color: '#2563eb' }}><Price amount={p.price} /></span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>/mo</span>
                          </div>
                        </div>
                        {sel && (
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</div>
                        )}
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ ...badgeStyle(p.badge, sel), display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px' }}>
                          {p.badge}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 9px' }}>
                          🏠 Hosting included
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 10px' }}>{p.description}</p>

                      {/* Features */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
                        {p.features.map(f => (
                          <li key={f} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Good for */}
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5, margin: 0, paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <strong style={{ fontStyle: 'normal', fontWeight: 600, color: '#64748b' }}>Good for:</strong> {p.goodFor}
                      </p>
                    </>
                  ) : (
                    /* ── Tablet / Desktop: horizontal flex layout ── */
                    <div style={{ display: 'flex', gap: '20px', minHeight: tablet ? 'auto' : '260px' }}>
                      {/* Left column */}
                      <div style={{ width: tablet ? '145px' : '165px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '8px' }}>{p.icon}</div>
                        <div style={{ fontSize: tablet ? '15px' : '17px', fontWeight: 700, color: '#0f1f3d', marginBottom: '6px', lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
                          <span style={{ fontSize: tablet ? '21px' : '24px', fontWeight: 800, color: '#2563eb', transition: 'transform 0.2s', display: 'inline-block', transform: sel || hov ? 'scale(1.05)' : 'scale(1)' }}>
                            <Price amount={p.price} />
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>/mo</span>
                        </div>
                        <span style={{ ...badgeStyle(p.badge, sel), display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px', width: 'fit-content', marginBottom: '8px' }}>
                          {p.badge}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 9px', width: 'fit-content', marginBottom: '10px' }}>
                          🏠 Hosting included
                        </span>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.65, margin: '0 0 8px', flex: 1 }}>{p.description}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5, margin: 0, marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <strong style={{ fontStyle: 'normal', fontWeight: 600, color: '#64748b' }}>Good for:</strong> {p.goodFor}
                        </p>
                      </div>

                      {/* Right column */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: '10px' }}>
                          What&apos;s included
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                          {p.features.map(f => (
                            <li key={f} style={{ fontSize: '12px', color: '#374151', lineHeight: 1.8, display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                              <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {p.details.length > 0 && (
                          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            {p.details.map((detail, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < p.details.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: 11, gap: 8 }}>
                                <span style={{ color: '#64748b' }}>{detail.label}</span>
                                <span style={{ fontWeight: 600, color: detail.value === 'Not included' ? '#94a3b8' : '#0f1f3d', textAlign: 'right', flexShrink: 0 }}>{detail.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Comparison table ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 10 }}>📊 Full Plan Comparison</div>

            {mobile ? (
              /* ── Mobile: no-scroll compact table ──
                 Feature column is flexible; 4 value columns are fixed 46px each.
                 At 375px screen - 32px padding = 343px → 343 - 184 = 159px feature column. */
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '46px' }} />
                  <col style={{ width: '46px' }} />
                  <col style={{ width: '46px' }} />
                  <col style={{ width: '46px' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '9px 10px', textAlign: 'left' as const, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}></th>
                    {[
                      { id: 'basic-care',   short: 'Basic',  price: '$29' },
                      { id: 'content-care', short: 'Cont.',  price: '$49' },
                      { id: 'growth-care',  short: 'Growth', price: '$100' },
                      { id: 'full-care',    short: 'Full',   price: '$150' },
                    ].map(col => {
                      const sel = selectedPlan === col.id
                      return (
                        <th
                          key={col.id}
                          onClick={() => setSelectedPlan(col.id)}
                          style={{ padding: '7px 2px', textAlign: 'center' as const, fontWeight: 700, color: sel ? '#2563eb' : '#374151', background: sel ? '#eff6ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '10px', cursor: 'pointer', lineHeight: 1.3 }}
                        >
                          <div>{col.short}</div>
                          <div style={{ fontSize: 9, fontWeight: sel ? 800 : 600, color: sel ? '#2563eb' : '#94a3b8', marginTop: 1 }}>{carePrice(col.id)}</div>
                          {sel && <div style={{ fontSize: 8, color: '#2563eb', marginTop: 1 }}>▲</div>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, ri) => {
                    const isPrice = row.type === 'price'
                    if (isPrice) return null // price already shown in header
                    return (
                      <tr key={row.feature} style={{ background: ri % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #f1f5f9', fontSize: '10px', lineHeight: 1.35, wordBreak: 'break-word' as const }}>{row.feature}</td>
                        {[row.basic, row.content, row.growth, row.full].map((val, ci) => {
                          const colId = ['basic-care', 'content-care', 'growth-care', 'full-care'][ci]
                          const isSel = selectedPlan === colId
                          return (
                            <td key={ci} style={{ padding: '7px 2px', textAlign: 'center' as const, borderBottom: '1px solid #f1f5f9', background: isSel ? '#eff6ff' : 'inherit', color: val === '✓' ? '#16a34a' : val === '—' ? '#d1d5db' : '#374151', fontWeight: val === '✓' ? 700 : 400, fontSize: '11px', lineHeight: 1.3, wordBreak: 'break-word' as const }}>
                              {val}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              /* ── Tablet / Desktop: full table with overflow scroll ── */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left' as const, fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0', fontSize: '11px', minWidth: 160 }}>Feature</th>
                      {[
                        { id: 'basic-care',   label: 'Basic' },
                        { id: 'content-care', label: 'Content' },
                        { id: 'growth-care',  label: 'Growth' },
                        { id: 'full-care',    label: 'Full' },
                      ].map(col => {
                        const sel = selectedPlan === col.id
                        return (
                          <th key={col.id} onClick={() => setSelectedPlan(col.id)} style={{ padding: '10px 14px', textAlign: 'center' as const, fontWeight: 700, color: sel ? '#2563eb' : '#374151', background: sel ? '#eff6ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                            {`${col.label} ${carePrice(col.id)}`}
                            {sel && <span style={{ display: 'block', fontSize: 9, fontWeight: 600, color: '#2563eb', marginTop: 2 }}>▲ Selected</span>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, ri) => {
                      const isPrice = row.type === 'price'
                      return (
                        <tr key={row.feature} style={{ background: isPrice ? '#f0f7ff' : ri % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding: '9px 14px', fontWeight: isPrice ? 700 : 600, color: '#374151', borderBottom: '1px solid #f1f5f9', fontSize: isPrice ? 12 : 11 }}>{row.feature}</td>
                          {[row.basic, row.content, row.growth, row.full].map((val, ci) => {
                            const colId = ['basic-care', 'content-care', 'growth-care', 'full-care'][ci]
                            const isSel = selectedPlan === colId
                            return (
                              <td key={ci} style={{ padding: '9px 14px', textAlign: 'center' as const, borderBottom: '1px solid #f1f5f9', background: isSel ? '#f0f7ff' : 'inherit', color: val === '✓' ? '#16a34a' : val === '—' ? '#cbd5e1' : isPrice ? '#2563eb' : '#374151', fontWeight: val === '✓' || isPrice ? 700 : 400, fontSize: isPrice ? 12 : 11 }}>
                                {isPrice ? `${carePrice(colId)}/mo` : val}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' as const }}>Tap a column header to select that plan</div>
          </div>

          {/* Warning note */}
          <div style={{ marginBottom: 36, padding: mobile ? '12px 14px' : '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.75 }}>
            <strong>⚠️ What&apos;s not included:</strong>
            {' '}Domain name, premium plugins, business email, advanced custom work, and extra update time are not included unless agreed separately. Content updates cover small changes only — new pages, redesigns, and advanced features are quoted separately. Minimum 6-month subscription. Hours do not roll over.
          </div>

          {/* ── Form ── */}
          {selectedPlan && plan && (
            <div ref={formRef} style={{ scrollMarginTop: '80px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: mobile ? '19px' : tablet ? '21px' : '24px', fontWeight: 800, color: '#0f1f3d', margin: '0 0 8px' }}>
                  Almost done! Tell us about your website.
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  We&apos;ll review your site and confirm it&apos;s compatible before anything is charged.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 300px' : '1fr', gap: '20px', alignItems: 'start' }}>

                  {/* Summary above form on mobile/tablet */}
                  {!isDesktop && <CareSummary plan={plan} />}

                  {/* Form fields */}
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: mobile ? '20px 16px' : '28px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={lbl}>Business Name <Req /></label>
                        <input style={errors.businessName ? inputErr : inputStyle} placeholder="e.g. Bloom Florist" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
                        <FieldErr msg={errors.businessName} />
                      </div>
                      <div>
                        <label style={lbl}>Your Full Name <Req /></label>
                        <input style={errors.fullName ? inputErr : inputStyle} placeholder="e.g. Sarah Miller" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                        <FieldErr msg={errors.fullName} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={lbl}>Email Address <Req /></label>
                        <input type="email" style={errors.email ? inputErr : inputStyle} placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        <FieldErr msg={errors.email} />
                      </div>
                      <div>
                        <label style={lbl}>Phone Number</label>
                        <input type="tel" style={inputStyle} placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={lbl}>Your current website URL <Req /></label>
                      <input
                        style={errors.website ? inputErr : inputStyle}
                        placeholder="e.g. yourbusiness.com"
                        value={form.website}
                        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      />
                      <FieldErr msg={errors.website} />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={lbl}>What platform is your website on?</label>
                      <select
                        value={platform}
                        onChange={e => setPlatform(e.target.value)}
                        style={{ ...inputStyle, appearance: 'auto', color: platform ? '#0f1f3d' : '#94a3b8' }}
                      >
                        <option value="">Select platform…</option>
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: apiError ? '14px' : 0 }}>
                      <label style={lbl}>Notes (optional)</label>
                      <textarea
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '96px' }}
                        placeholder="Any specific things you'd like us to update or fix? Any concerns about your current site?"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      />
                    </div>

                    {apiError && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#dc2626', lineHeight: 1.6 }}>
                        {apiError}
                      </div>
                    )}
                  </div>

                  {/* Sticky sidebar on desktop */}
                  {isDesktop && (
                    <div style={{ position: 'sticky', top: '80px' }}>
                      <CareSummary plan={plan} />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...btnPrimary, opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? 'Submitting…' : 'Start My Care Plan →'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '12px', lineHeight: 1.6 }}>
                    🔒 No payment required now. We&apos;ll check your website is compatible before charging anything.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Prompt when no plan selected */}
          {!selectedPlan && (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
              ↑ Select a plan above to continue
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', height: '60px', display: 'flex', alignItems: 'center', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f1f3d', letterSpacing: '-0.02em' }}>AG Development</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Need help?</span>
          <Link href="/contact" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Contact us</Link>
        </div>
      </div>
    </header>
  )
}

function CareSummary({ plan }: { plan: typeof CARE_PLANS[0] }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f1f3d', margin: '0 0 14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        Order Summary
      </h3>
      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', margin: '0 0 8px' }}>Selected Plan</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f1f3d' }}>{plan.name}</span>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#2563eb' }}><Price amount={plan.price} />/mo</span>
      </div>
      <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: '4px 0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        🏠 Web hosting included ✓
      </p>
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Monthly Total</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}><Price amount={plan.price} />/mo</span>
        </div>
      </div>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#1e40af', lineHeight: 1.6 }}>
        🔒 <strong>No payment today.</strong> We&apos;ll contact you within 1 business day to confirm details and arrange payment.
      </div>
    </div>
  )
}

function Req() {
  return <span style={{ color: '#ef4444' }}>*</span>
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{msg}</p>
}
