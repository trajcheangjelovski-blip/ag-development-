'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import clsx from 'clsx'
import { BUILD_PACKAGES, CARE_PLANS } from './_data'
import { useMergedCards } from '@/lib/usePlans'
import { regionFromLocale } from '@/i18n/routing'
import { formatPrice } from '@/lib/money'
import { Price } from '@/components/public/Price'
import { RadioDot, InfoBox, StepBar, SummaryCard } from './_components'

// ── Types ─────────────────────────────────────────────────────────────────────

type BuildPkg = (typeof BUILD_PACKAGES)[0] | undefined
type CarePlan = (typeof CARE_PLANS)[0]

type DetailRow = { label: string; value: string }
type ComparisonRow = {
  feature: string
  basic: string
  content: string
  growth: string
  full: string
  type: string
}

type FormState = {
  businessName: string
  fullName: string
  email: string
  phone: string
  website: string
  message: string
}

// Denar fallback prices, keyed by plan id. Used only for the very first paint on
// the MK site (before the live /api/plans response arrives) so prices don't
// flash the USD catalog amount and then switch to denars. Live values from the
// admin-managed plans table still override these once loaded.
const MKD_FALLBACK: Record<string, number> = {
  'starter-site': 6000,
  'business-site': 10000,
  'premium-site': 20000,
  'ecommerce-store': 35000,
  'basic-care': 1500,
  'content-care': 3000,
  'growth-care': 6000,
  'full-care': 10000,
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ name }: { name: string }) {
  const t = useTranslations('orderPage')
  const nextSteps = t.raw('success.steps') as string[]

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-6 py-10 md:px-12 md:py-[60px] text-center max-w-[580px] w-full">
        <div className="text-[64px] leading-none mb-5">🎉</div>
        <h1 className="text-[28px] font-extrabold text-[#0f1f3d] m-0 mb-2.5">{t('success.title')}</h1>
        <p className="text-base text-slate-500 m-0 mb-8">
          {t.rich('success.thanks', {
            name,
            days: t('success.oneBusinessDay'),
            strong: (chunks) => <strong className="text-[#0f1f3d]">{chunks}</strong>,
          })}
        </p>

        <div className="text-left bg-slate-50 rounded-xl p-6 mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 m-0 mb-4">
            {t('success.whatNext')}
          </p>
          {nextSteps.map((s, i) => (
            <div key={i} className={clsx('flex items-start gap-3', i < nextSteps.length - 1 && 'mb-3')}>
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600 leading-[1.5]">{s}</span>
            </div>
          ))}
        </div>

        <div className="mb-7 p-[18px] px-[22px] bg-slate-50 border border-slate-200 rounded-xl text-left">
          <div className="text-[13px] font-bold text-[#0f1f3d] mb-2.5">
            {t('success.alsoTitle')}
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <a href="/order/it-support" className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0f1f3d] no-underline">
              {t('success.itLink')}
            </a>
            <a href="/order/social-media" className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0f1f3d] no-underline">
              {t('success.socialLink')}
            </a>
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="inline-block bg-[#0f1f3d] text-white px-7 py-3 rounded-[10px] no-underline text-sm font-semibold">
            {t('success.backHome')}
          </Link>
          <Link href="/contact" className="inline-block bg-slate-100 text-gray-700 px-7 py-3 rounded-[10px] no-underline text-sm font-semibold">
            {t('success.contact')}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Landing choice ────────────────────────────────────────────────────────────

function LandingChoice({ onSelectWebsite }: { onSelectWebsite: () => void }) {
  const t = useTranslations('orderPage')
  const choices = [
    {
      id: 'website',
      icon: '🌐',
      title: t('landing.websiteTitle'),
      desc: t('landing.websiteDesc'),
      cta: t('landing.websiteCta'),
      ctaClass: 'text-blue-600',
      isButton: true,
    },
    {
      id: 'it',
      icon: '🛡️',
      title: t('landing.itTitle'),
      desc: t('landing.itDesc'),
      cta: t('landing.itCta'),
      ctaClass: 'text-blue-600',
      href: '/order/it-support',
    },
    {
      id: 'social',
      icon: '📱',
      title: t('landing.socialTitle'),
      desc: t('landing.socialDesc'),
      cta: t('landing.socialCta'),
      ctaClass: 'text-violet-600',
      href: '/order/social-media',
    },
  ]

  const cardInner = (c: (typeof choices)[0]) => (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 px-6 text-left h-full card-hover cursor-pointer">
      <div className="text-[38px] leading-none mb-4">{c.icon}</div>
      <div className="text-[17px] font-bold text-[#0f1f3d] mb-2">{c.title}</div>
      <div className="text-[13px] text-slate-500 leading-[1.65] mb-5">{c.desc}</div>
      <div className={clsx('text-xs font-bold', c.ctaClass)}>{c.cta} →</div>
    </div>
  )

  return (
    <div className="min-h-[80vh] bg-slate-50">
      <div className="max-w-[780px] mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="text-center mb-12">
          <p className="section-label">{t('landing.eyebrow')}</p>
          <h1 className="text-[26px] md:text-[34px] font-extrabold text-[#0f1f3d] m-0 mb-3">
            {t('landing.title')}
          </h1>
          <p className="text-base text-slate-500 m-0">
            {t('landing.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map(c =>
            c.isButton ? (
              <button
                key={c.id}
                onClick={onSelectWebsite}
                className="bg-transparent border-0 p-0 font-[inherit] block w-full text-left cursor-pointer"
              >
                {cardInner(c)}
              </button>
            ) : (
              <Link key={c.id} href={c.href!} className="no-underline block">
                {cardInner(c)}
              </Link>
            ),
          )}
        </div>

        <p className="text-center text-[13px] text-slate-400 mt-8">
          {t('landing.notSure')}{' '}
          <Link href="/pricing" className="text-blue-600 font-semibold no-underline">
            {t('landing.viewAll')}
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Order flow ────────────────────────────────────────────────────────────────

function OrderContent() {
  const t = useTranslations('orderPage')
  const searchParams = useSearchParams()
  const packageParam = searchParams.get('package')

  const [step, setStep] = useState(1)
  const [showLanding, setShowLanding] = useState(packageParam === null)
  const [skippedCare, setSkippedCare] = useState(false)
  const [selectedBuild, setSelectedBuild] = useState(packageParam ?? 'business-site')
  const [selectedCare, setSelectedCare] = useState('content-care')
  const [customNote, setCustomNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormState>({
    businessName: '', fullName: '', email: '', phone: '', website: '', message: '',
  })
  const [coupon, setCoupon] = useState('')

  const locale = useLocale()
  const region = regionFromLocale(locale)

  // Region-aware static fallback so the first paint already shows the right
  // currency (MK denars) instead of flashing the USD catalog price before the
  // live /api/plans response arrives. Live values still override once loaded.
  const staticBuild = region === 'mk'
    ? BUILD_PACKAGES.map(p => ({ ...p, price: MKD_FALLBACK[p.id] ?? p.price, originalPrice: MKD_FALLBACK[p.id] ?? p.originalPrice }))
    : BUILD_PACKAGES
  const staticCare = region === 'mk'
    ? CARE_PLANS.map(p => ({ ...p, price: MKD_FALLBACK[p.id] ?? p.price }))
    : CARE_PLANS

  // Live (admin-editable) plan content merged over the static cards
  const buildPackages = useMergedCards(staticBuild)
  const carePlans = useMergedCards(staticCare)

  const isCustom = selectedBuild === 'custom'
  const buildPkg: BuildPkg = buildPackages.find(p => p.id === selectedBuild)
  const carePlan: CarePlan = carePlans.find(p => p.id === selectedCare) ?? carePlans[0]
  const oneTimeTotal = buildPkg?.price ?? 0

  const fmt = (n: number) => formatPrice(n, region === 'mk' ? 'MKD' : 'USD', locale)
  const priceOf = (id: string) => carePlans.find(p => p.id === id)?.price ?? 0

  // Card copy comes from the message catalog (package names stay English).
  const buildName = (id: string) => t(`build.${id}.name`)
  const careName = (id: string) => t(`care.${id}.name`)

  function goTo(n: number) {
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.businessName.trim()) e.businessName = t('step3.required')
    if (!form.fullName.trim()) e.fullName = t('step3.required')
    if (!form.email.trim()) e.email = t('step3.required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('step3.invalidEmail')
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')

    // Admin-facing lead summary — kept in English for the internal dashboard.
    const parts: string[] = []
    if (isCustom) {
      parts.push(`Custom Package: ${customNote || 'See notes'}`)
    } else if (buildPkg) {
      if (skippedCare) {
        parts.push(`Website Build Only: ${buildPkg.name} (${fmt(buildPkg.price)} one-time) — No care plan`)
      } else {
        parts.push(`Website Build: ${buildPkg.name} (${fmt(buildPkg.price)})`)
        if (carePlan.id !== 'none') parts.push(`Care Plan: ${carePlan.name} (${fmt(carePlan.price)}/mo)`)
      }
    }

    const budget = carePlan.price > 0 ? carePlan.price : (oneTimeTotal > 0 ? oneTimeTotal : 1)

    try {
      // Capture the order details as a lead (best-effort — don't block checkout)
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.businessName.trim(),
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          help_type: parts.join(' + '),
          budget,
          message: form.message.trim() || undefined,
        }),
      }).catch(() => {})

      // Custom packages need a manual quote — no online checkout
      if (isCustom) {
        setSubmittedName(form.fullName.split(' ')[0] || 'there')
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      // Everything selected goes to Stripe Checkout
      const items: string[] = []
      if (buildPkg?.id) items.push(buildPkg.id)
      if (!skippedCare && carePlan.id !== 'none') items.push(carePlan.id)

      if (!items.length) {
        // Nothing purchasable selected — just confirm the lead
        setSubmittedName(form.fullName.split(' ')[0] || 'there')
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, region, coupon_code: coupon.trim() || undefined }),
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

  if (submitted) return <SuccessScreen name={submittedName} />
  if (showLanding) return <LandingChoice onSelectWebsite={() => setShowLanding(false)} />

  const CARE_COLS = [
    { id: 'basic-care',   label: `${t('step2.cols.basic')} ${fmt(priceOf('basic-care'))}` },
    { id: 'content-care', label: `${t('step2.cols.content')} ${fmt(priceOf('content-care'))}` },
    { id: 'growth-care',  label: `${t('step2.cols.growth')} ${fmt(priceOf('growth-care'))}` },
    { id: 'full-care',    label: `${t('step2.cols.full')} ${fmt(priceOf('full-care'))}` },
  ]

  const comparisonRows = t.raw('step2.comparison') as ComparisonRow[]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-7 md:py-10">

        <div className="flex justify-center gap-3 md:gap-7 mb-4 flex-wrap">
          <Link href="/order/it-support" className="text-xs text-slate-400 no-underline whitespace-nowrap">
            {t('cross.itQ')}{' '}
            <span className="text-blue-600 font-semibold">{t('cross.itLink')}</span>
          </Link>
          <Link href="/order/social-media" className="text-xs text-slate-400 no-underline whitespace-nowrap">
            {t('cross.socialQ')}{' '}
            <span className="text-violet-600 font-semibold">{t('cross.socialLink')}</span>
          </Link>
        </div>

        <StepBar step={step} skipped={skippedCare} />

        {/* ── Step 1: Package ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            {isCustom ? (
              <>
                <div className="text-center mb-8">
                  <p className="section-label">{t('step1.eyebrow')}</p>
                  <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#0f1f3d] m-0 mb-2.5">
                    {t('step1.customTitle')}
                  </h1>
                  <p className="text-[15px] text-slate-500 m-0">
                    {t('step1.customSubtitle')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-[600px] mx-auto mb-6">
                  <textarea
                    className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-lg text-sm text-[#0f1f3d] outline-none font-[inherit] resize-y min-h-[150px] box-border"
                    placeholder={t('step1.customPlaceholder')}
                    value={customNote}
                    onChange={e => setCustomNote(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2 mb-0">
                    {t('step1.customHint')}
                  </p>
                </div>
                <button onClick={() => goTo(2)} className="block w-full bg-[#0f1f3d] text-white border-0 rounded-[10px] px-7 py-3.5 text-[15px] font-semibold cursor-pointer font-[inherit] text-center mt-6">
                  {t('step1.customContinue')}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-7">
                  <p className="section-label">{t('step1.eyebrow')}</p>
                  <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#0f1f3d] m-0 mb-2.5">
                    {t('step1.title')}
                  </h1>
                  <p className="text-[15px] text-slate-500 m-0">
                    {t('step1.subtitle')}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 rounded-xl px-5 py-3.5 mb-6 flex items-center justify-center gap-2.5 flex-wrap">
                  <span className="text-base">🎉</span>
                  <span className="text-[13px] font-semibold text-white text-center">
                    {t('step1.banner')}
                  </span>
                  <span className="text-base">🎉</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[860px] mx-auto mb-5 pt-2">
                  {buildPackages.map(p => {
                    const sel = selectedBuild === p.id
                    const features = t.raw(`build.${p.id}.features`) as string[]
                    const details = t.raw(`build.${p.id}.details`) as DetailRow[]
                    const onSale = p.originalPrice > p.price
                    return (
                      <div key={p.id} className={clsx('relative', p.popular && 'pt-4')}>
                        {p.popular && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-5 py-[5px] rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(37,99,235,0.35)] z-10 tracking-[0.03em]">
                            {t('step1.mostPopular')}
                          </div>
                        )}

                        <div
                          onClick={() => setSelectedBuild(p.id)}
                          className={clsx(
                            'group relative flex flex-col rounded-2xl border-2 pt-7 px-6 pb-6 cursor-pointer',
                            'transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                            sel
                              ? 'border-blue-600 bg-[#f8faff] -translate-y-1'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-[#fafcff] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)]',
                          )}
                          style={sel ? { boxShadow: '0 0 0 4px rgba(37,99,235,0.1), 0 8px 24px rgba(37,99,235,0.12)' } : undefined}
                        >
                          {/* Left selection bar */}
                          {sel && (
                            <div className="absolute left-0 top-[10%] h-[80%] w-1 bg-gradient-to-b from-blue-600 to-violet-600 rounded-r" />
                          )}

                          {/* Icon + save badge */}
                          <div className="flex justify-between items-start mb-3">
                            <div
                              className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] transition-transform duration-200 group-hover:scale-110"
                              style={{ background: p.iconBg }}
                            >
                              {p.icon}
                            </div>
                            {onSale && (
                              <span className="bg-red-600 text-white text-[10px] font-bold px-[9px] py-[3px] rounded-full uppercase tracking-[0.05em]">
                                {t('step1.save')} <Price amount={p.originalPrice - p.price} />
                              </span>
                            )}
                          </div>

                          <div className="text-lg font-bold text-[#0f1f3d] mb-1.5 leading-tight">
                            {buildName(p.id)}
                          </div>

                          <div className="flex items-baseline gap-2 mb-2.5">
                            <span className="text-[32px] font-extrabold text-[#0f1f3d] leading-none inline-block transition-transform duration-200 group-hover:scale-[1.03]">
                              <Price amount={p.price} />
                            </span>
                            {onSale && <span className="text-[13px] text-slate-400 line-through"><Price amount={p.originalPrice} /></span>}
                            <span className="text-xs text-slate-400">{t('step1.oneTime')}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className={clsx(
                              'text-[10px] font-bold px-[10px] py-[3px] rounded-full uppercase tracking-[0.05em]',
                              p.popular ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
                            )}>
                              {t(`build.${p.id}.badge`)}
                            </span>
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-[3px] rounded-full">
                              {t('step1.domainBadge')}
                            </span>
                          </div>

                          <div className="text-[13px] text-slate-500 leading-[1.65] mb-3.5">
                            {t(`build.${p.id}.description`)}
                          </div>

                          <div className="h-px bg-slate-100 mb-3" />

                          <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-2.5">
                            {t('step1.whatsIncluded')}
                          </div>

                          <div className="mb-3.5">
                            {features.map(f => (
                              <div key={f} className="flex gap-[7px] mb-1.5 items-start">
                                <span className="text-green-600 font-bold flex-shrink-0 text-xs mt-[1px]">✓</span>
                                <span className="text-xs text-gray-700 leading-[1.5]">{f}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 rounded-[10px] p-3 mb-3">
                            {details.map(d => (
                              <div key={d.label} className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.05em]">
                                  {d.label}
                                </span>
                                <span className={clsx(
                                  'text-xs font-bold',
                                  d.value === t('notIncluded') ? 'text-slate-400' : 'text-[#0f1f3d]',
                                )}>
                                  {d.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mb-3">
                            <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1">
                              {t('step1.bestFor')}
                            </div>
                            <div className="text-[11px] text-slate-500 italic leading-[1.55]">
                              {t(`build.${p.id}.goodFor`)}
                            </div>
                          </div>

                          <div className="mt-auto px-3 py-[9px] bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-[1.5]">
                            {t('step1.addCareHint')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {!isCustom && (
              <div className="max-w-[860px] mx-auto mt-6">
                <div className="flex gap-3 w-full items-center">
                  <button
                    onClick={() => { setSelectedCare('none'); setSkippedCare(true); goTo(3) }}
                    disabled={!selectedBuild}
                    className={clsx(
                      'flex-1 px-5 py-[13px] bg-white rounded-[10px] text-sm font-semibold border-2 transition-all duration-200 font-[inherit]',
                      selectedBuild
                        ? 'text-[#0f1f3d] border-[#0f1f3d] cursor-pointer'
                        : 'text-slate-400 border-slate-200 cursor-not-allowed',
                    )}
                  >
                    {t('step1.orderWebsiteOnly')}
                  </button>
                  <div className="flex-shrink-0 text-xs font-semibold text-slate-400 px-1">{t('step1.or')}</div>
                  <button
                    onClick={() => { setSkippedCare(false); goTo(2) }}
                    disabled={!selectedBuild}
                    className={clsx(
                      'flex-1 px-5 py-[13px] rounded-[10px] text-sm font-semibold border-0 transition-all duration-200 font-[inherit]',
                      selectedBuild
                        ? 'bg-[#0f1f3d] text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                    )}
                  >
                    {t('step1.continueCare')}
                  </button>
                </div>
                <div className="flex justify-between w-full pt-2">
                  <div className="flex-1 text-[11px] text-slate-400 text-center pr-10">
                    {t('step1.noHostingNote')}
                  </div>
                  <div className="flex-1 text-[11px] text-green-600 text-center pl-10">
                    {t('step1.hostingNote')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Care Plan ───────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="text-center mb-7">
              <p className="section-label">{t('step2.eyebrow')}</p>
              <h1 className="text-[22px] md:text-[28px] font-extrabold text-[#0f1f3d] m-0 mb-2.5">
                {t('step2.title')}
              </h1>
              <p className="text-[15px] text-slate-500 m-0 max-w-[500px] mx-auto">
                {t('step2.subtitle')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-xl px-5 py-4 mb-6 flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0">✅</span>
              <div>
                <div className="font-bold text-sm text-green-800 mb-1">
                  {t('step2.hostingTitle')}
                </div>
                <div className="text-[13px] text-green-800 leading-[1.7]">
                  {t('step2.hostingText')}
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedCare('none')}
              className={clsx(
                'border-2 border-dashed rounded-[10px] px-[18px] py-3 mb-5 cursor-pointer flex items-center gap-3 transition-all duration-200',
                selectedCare === 'none' ? 'border-blue-600 bg-[#fafbff]' : 'border-slate-300 bg-transparent',
              )}
            >
              <RadioDot on={selectedCare === 'none'} />
              <div>
                <span className="text-sm font-semibold text-slate-500">{t('step2.skipTitle')}</span>
                <span className="text-xs text-slate-400 block mt-[1px]">
                  {t('step2.skipSub')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
              {carePlans.filter(p => p.id !== 'none').map(p => {
                const sel = selectedCare === p.id
                const features = t.raw(`care.${p.id}.features`) as string[]
                const details = t.raw(`care.${p.id}.details`) as DetailRow[]
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedCare(p.id)}
                    className={clsx(
                      'relative flex flex-col rounded-2xl border-2 p-7 cursor-pointer min-h-[280px]',
                      'transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                      sel
                        ? 'border-blue-600 bg-[#f8faff] -translate-y-[3px]'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-[#fafcff] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
                    )}
                    style={sel ? { boxShadow: '0 0 0 4px rgba(37,99,235,0.1), 0 8px 24px rgba(37,99,235,0.12)' } : undefined}
                  >
                    {p.recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-[3px] rounded-full whitespace-nowrap">
                        {t('step2.recommended')}
                      </span>
                    )}
                    {sel && (
                      <div className="absolute left-0 top-[15%] h-[70%] w-1 bg-gradient-to-b from-blue-600 to-violet-600 rounded-r" />
                    )}

                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[32px] leading-none">{p.icon}</span>
                        <span className="text-lg font-bold text-[#0f1f3d]">{careName(p.id)}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className={clsx(
                          'text-2xl font-extrabold text-blue-600 leading-none inline-block transition-transform duration-200',
                          sel && 'scale-[1.06]',
                        )}>
                          <Price amount={p.price} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{t('step2.perMonth')}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className={clsx(
                        'inline-flex items-center gap-[5px] bg-green-50 border border-green-200 rounded-full px-3.5 py-[5px] text-xs font-semibold text-green-800 transition-all duration-200',
                        sel && 'shadow-[0_2px_8px_rgba(22,163,74,0.2)]',
                      )}>
                        {t('step2.hostingIncluded')}
                      </span>
                    </div>

                    <p className="text-[13px] text-slate-500 leading-[1.7] m-0 mb-3.5">{t(`care.${p.id}.description`)}</p>

                    <ul className="list-none p-0 m-0 mb-3.5 flex-1">
                      {features.map(f => (
                        <li key={f} className="text-[13px] text-gray-700 leading-[1.9] flex items-start gap-[7px]">
                          <span className="text-green-600 font-bold flex-shrink-0 mt-[1px]">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {details.length > 0 && (
                      <div className="my-3.5 px-3.5 py-3 bg-slate-50 rounded-[10px] border border-slate-100">
                        {details.map((d, i) => (
                          <div
                            key={i}
                            className={clsx(
                              'flex justify-between items-center py-[5px] text-xs',
                              i < details.length - 1 && 'border-b border-slate-200',
                            )}
                          >
                            <span className="text-slate-500">{d.label}</span>
                            <span className={clsx(
                              'font-semibold',
                              d.value === t('notIncluded') ? 'text-slate-400' : 'text-[#0f1f3d]',
                            )}>
                              {d.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-2.5 mt-auto">
                      <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 block mb-[3px]">
                        {t('step2.goodFor')}
                      </span>
                      <span className={clsx(
                        'text-xs italic leading-[1.5] transition-colors duration-200',
                        sel ? 'text-slate-500' : 'text-slate-400',
                      )}>
                        {t(`care.${p.id}.goodFor`)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comparison table */}
            <div className="mb-7">
              <div className="text-sm font-bold text-[#0f1f3d] mb-3">{t('step2.comparisonTitle')}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs rounded-[10px] overflow-hidden border border-slate-200" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3.5 py-2.5 text-left font-bold text-gray-700 border-b border-slate-200 text-[11px] min-w-[160px]">
                        {t('step2.featureCol')}
                      </th>
                      {CARE_COLS.map(col => {
                        const sel = selectedCare === col.id
                        return (
                          <th
                            key={col.id}
                            onClick={() => setSelectedCare(col.id)}
                            className={clsx(
                              'px-3.5 py-2.5 text-center font-bold border-b border-slate-200 text-[11px] cursor-pointer whitespace-nowrap',
                              sel ? 'text-blue-600 bg-blue-50' : 'text-gray-700 bg-slate-50',
                            )}
                          >
                            {col.label}
                            {sel && <span className="block text-[9px] font-semibold text-blue-600 mt-0.5">{t('step2.selected')}</span>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, ri) => {
                      const isPrice = row.type === 'price'
                      const values = isPrice
                        ? CARE_COLS.map(c => `${fmt(priceOf(c.id))}${t('summary.perMo')}`)
                        : [row.basic, row.content, row.growth, row.full]
                      return (
                        <tr
                          key={row.feature}
                          className={isPrice ? 'bg-blue-50' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                        >
                          <td className={clsx(
                            'px-3.5 py-[9px] border-b border-slate-100',
                            isPrice ? 'font-bold text-[13px] text-gray-700' : 'font-semibold text-xs text-gray-700',
                          )}>
                            {row.feature}
                          </td>
                          {values.map((val, ci) => {
                            const colId = CARE_COLS[ci].id
                            const isSel = selectedCare === colId
                            return (
                              <td
                                key={ci}
                                className={clsx(
                                  'px-3.5 py-[9px] text-center border-b border-slate-100',
                                  isSel && 'bg-[#f0f7ff]',
                                  val === '✓' ? 'text-green-600 font-bold' : val === '—' ? 'text-slate-300' : isPrice ? 'text-blue-600 font-bold text-[13px]' : 'text-gray-700',
                                )}
                              >
                                {val}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 text-center">
                {t('step2.clickHint')}
              </div>
            </div>

            <div className="mb-5 px-[18px] py-3.5 bg-amber-50 border border-amber-200 rounded-[10px] text-xs text-amber-800 leading-[1.7]">
              <strong>{t('step2.noteStrong')}</strong>{' '}
              {t('step2.noteText')}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goTo(1)}
                className="bg-transparent border border-slate-200 rounded-[10px] px-5 py-2.5 text-sm text-slate-500 cursor-pointer font-[inherit] flex-shrink-0 whitespace-nowrap"
              >
                {t('step2.back')}
              </button>
              <button
                onClick={() => goTo(3)}
                className="flex-1 block bg-[#0f1f3d] text-white border-0 rounded-[10px] px-7 py-3.5 text-[15px] font-semibold cursor-pointer font-[inherit] text-center"
              >
                {t('step2.continueDetails')}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact form ────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-8">
              <p className="section-label">{t('step3.eyebrow')}</p>
              <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#0f1f3d] m-0 mb-2.5">
                {t('step3.title')}
              </h1>
              <p className="text-[15px] text-slate-500 m-0">
                {t('step3.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">
              <div className="md:hidden">
                <SummaryCard build={buildPkg} care={carePlan} isCustom={isCustom} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="form-label">{t('step3.businessName')} <span className="text-red-400">*</span></label>
                    <input
                      className={clsx('form-input', errors.businessName && 'form-input-error')}
                      placeholder={t('step3.businessNamePlaceholder')}
                      value={form.businessName}
                      onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    />
                    {errors.businessName && <p className="form-error">{errors.businessName}</p>}
                  </div>
                  <div>
                    <label className="form-label">{t('step3.fullName')} <span className="text-red-400">*</span></label>
                    <input
                      className={clsx('form-input', errors.fullName && 'form-input-error')}
                      placeholder={t('step3.fullNamePlaceholder')}
                      value={form.fullName}
                      onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    />
                    {errors.fullName && <p className="form-error">{errors.fullName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="form-label">{t('step3.email')} <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      className={clsx('form-input', errors.email && 'form-input-error')}
                      placeholder={t('step3.emailPlaceholder')}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="form-label">{t('step3.phone')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder={t('step3.phonePlaceholder')}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">{t('step3.website')}</label>
                  <input
                    className="form-input"
                    placeholder={t('step3.websitePlaceholder')}
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">{t('step3.message')}</label>
                  <textarea
                    rows={4}
                    className="form-input resize-y min-h-[100px]"
                    placeholder={t('step3.messagePlaceholder')}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  />
                </div>

                {!isCustom && (
                  <div className={apiError ? 'mb-4' : ''}>
                    <label className="form-label">{t('step3.coupon')}</label>
                    <input
                      className="form-input uppercase"
                      placeholder={t('step3.couponPlaceholder')}
                      value={coupon}
                      onChange={e => setCoupon(e.target.value.toUpperCase())}
                    />
                  </div>
                )}

                {apiError && <InfoBox type="red">{apiError}</InfoBox>}
              </div>

              <div className="hidden md:block sticky top-20">
                <SummaryCard build={buildPkg} care={carePlan} isCustom={isCustom} />
              </div>
            </div>

            <div className="flex gap-3 items-center mt-6">
              <button
                type="button"
                onClick={() => goTo(skippedCare ? 1 : 2)}
                className="bg-transparent border border-slate-200 rounded-[10px] px-5 py-2.5 text-sm text-slate-500 cursor-pointer font-[inherit] flex-shrink-0 whitespace-nowrap"
              >
                {t('step3.back')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'flex-1 block bg-[#0f1f3d] text-white border-0 rounded-[10px] px-7 py-3.5 text-[15px] font-semibold font-[inherit] text-center',
                  loading ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                {loading
                  ? (isCustom ? t('step3.submittingCustom') : t('step3.submittingPay'))
                  : (isCustom ? t('step3.submitCustom') : t('step3.submitPay'))}
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              {isCustom ? t('step3.footnoteCustom') : t('step3.footnotePay')}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

function OrderHeader() {
  const t = useTranslations('orderPage')
  return (
    <header className="bg-white border-b border-slate-200 h-[60px] flex items-center px-6 sticky top-0 z-[100]">
      <div className="max-w-[900px] mx-auto w-full flex items-center justify-between">
        <Link href="/" className="no-underline">
          <span className="text-base font-extrabold text-[#0f1f3d] tracking-tight">AG Development</span>
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-slate-400">{t('header.needHelp')}</span>
          <Link href="/contact" className="text-[13px] text-blue-600 font-semibold no-underline">
            {t('header.contact')}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function OrderPage() {
  return (
    <>
      <OrderHeader />

      <Suspense fallback={
        <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center">
          <span className="text-sm text-slate-400">Loading…</span>
        </div>
      }>
        <OrderContent />
      </Suspense>
    </>
  )
}
