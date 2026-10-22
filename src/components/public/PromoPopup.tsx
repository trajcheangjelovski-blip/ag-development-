'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { LogoMark } from './Logo'

// Per-locale promotional popup. Mirrors the current sales offer:
//  • mk — "Специјална понуда" (discounted website build + monthly maintenance)
//  • en — limited-time 50% off every website build and care plan
// Content is hardcoded per locale (not in the i18n catalogs) because the copy
// is marketing-specific and each locale reflects a different regional offer.
//
// Shows once per visitor: after it's dismissed (X, backdrop, Esc, decline, or
// clicking the CTA) we drop a localStorage flag so it doesn't reappear on later
// visits. Bump a content `storageKey` to re-show that locale's popup when the
// offer changes.

const SHOW_DELAY_MS = 1500

type Offer = {
  label: string
  oldPrice: string
  newPrice: string
  unit?: string
  discount: string
}

type PromoContent = {
  storageKey: string
  badge: string
  titleLead: string
  titleHighlight: string
  titleTrail?: string
  subtitle: string
  offers: Offer[]
  features: string[]
  ctaLabel: string
  ctaHref: string
  declineLabel: string
  closeLabel: string
}

// Four shared feature icons (monitor, phone, chart, shield). Labels come from
// the locale content.
const featureIcons = [
  (
    <svg key="design" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  (
    <svg key="mobile" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  ),
  (
    <svg key="visibility" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  (
    <svg key="support" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
]

const CONTENT: Record<'mk' | 'en', PromoContent> = {
  mk: {
    storageKey: 'ag_promo_mk_2026_10',
    badge: 'Ограничена понуда',
    titleLead: 'Специјална понуда за ',
    titleHighlight: 'изработка на веб страна',
    subtitle: 'Професионална, модерна и мобилно прилагодена веб страна за вашиот бизнис.',
    offers: [
      { label: 'Изработка на веб страна', oldPrice: '10.000 ден', newPrice: '6.000 ден', discount: '-40%' },
      { label: 'Месечно одржување', oldPrice: '1.500 ден / месечно', newPrice: '800 ден', unit: '/ месечно', discount: '-47%' },
    ],
    features: ['Модерен дизајн', 'Мобилно прилагодена', 'Подобра видливост', 'Сигурна поддршка'],
    ctaLabel: 'Контактирајте нè денес →',
    ctaHref: '/contact',
    declineLabel: 'Не, благодарам',
    closeLabel: 'Затвори',
  },
  en: {
    storageKey: 'ag_promo_en_2026_10',
    badge: 'Limited offer',
    titleLead: 'Get ',
    titleHighlight: '50% off',
    titleTrail: ' your new website',
    subtitle: 'Modern, mobile-friendly websites for your business — every build and care plan is on sale right now.',
    offers: [
      { label: 'Website build (Business Site)', oldPrice: '$250', newPrice: '$125', unit: 'one-time', discount: '-50%' },
      { label: 'Monthly care (Basic Care)', oldPrice: '$29', newPrice: '$14', unit: '/mo', discount: '-52%' },
    ],
    features: ['Modern design', 'Mobile-friendly', 'Better visibility', 'Reliable support'],
    ctaLabel: 'Claim 50% off →',
    ctaHref: '/pricing',
    declineLabel: 'No, thanks',
    closeLabel: 'Close',
  },
}

export function PromoPopup({ locale }: { locale: 'mk' | 'en' }) {
  const content = CONTENT[locale]
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(content.storageKey) === '1'
    } catch {
      // localStorage can throw (private mode / blocked) — just show the popup.
    }
    if (dismissed) return

    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [content.storageKey])

  // Lock body scroll while open and close on Escape.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(content.storageKey, '1')
    } catch {
      // Ignore — worst case the popup shows again next visit.
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-up"
        onClick={close}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl animate-fade-up-1"
        style={{
          background: 'linear-gradient(145deg, #0a1628 0%, #0f1f3d 55%, #162b52 100%)',
          border: '1px solid rgba(96,165,250,0.25)',
          boxShadow: '0 25px 70px -15px rgba(37,99,235,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Glow accents */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)', filter: 'blur(45px)' }}
        />

        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label={content.closeLabel}
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="relative z-[1] p-7 sm:p-8">
          {/* Header: logo */}
          <div className="flex items-center justify-between mb-5 pr-8">
            <div className="flex items-center gap-2.5">
              <LogoMark size={34} />
              <div className="leading-tight">
                <div className="text-white font-display font-bold text-sm">AG Development</div>
                <div className="text-[10px] text-white/50 font-medium tracking-wide">ag-development.dev</div>
              </div>
            </div>
          </div>

          {/* Limited-offer badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-300 mb-4"
            style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            {content.badge}
          </div>

          {/* Title */}
          <h2 id="promo-title" className="font-display text-2xl sm:text-[28px] font-extrabold leading-tight text-white mb-2">
            {content.titleLead}
            <span className="gradient-text">{content.titleHighlight}</span>
            {content.titleTrail}
          </h2>
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            {content.subtitle}
          </p>

          {/* Offers */}
          <div className="space-y-3 mb-6">
            {content.offers.map((o) => (
              <div key={o.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs font-semibold text-white/60 mb-1">{o.label}</div>
                <div className="flex items-end gap-2.5 flex-wrap">
                  <span className="text-white/40 line-through text-sm">{o.oldPrice}</span>
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-cyan-300">
                    {o.newPrice}
                    {o.unit && <span className="text-sm font-semibold text-white/70"> {o.unit}</span>}
                  </span>
                  <span className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg text-cyan-200" style={{ background: 'rgba(34,211,238,0.14)' }}>
                    {o.discount}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-2.5 mb-7">
            {content.features.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium text-white/70">
                <span className="text-blue-300 flex-shrink-0">{featureIcons[i]}</span>
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={content.ctaHref}
            onClick={close}
            className="btn-shimmer btn-glow flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl font-bold text-base text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {content.ctaLabel}
          </Link>

          <button
            type="button"
            onClick={close}
            className="block w-full text-center text-xs text-white/40 hover:text-white/60 mt-3.5 transition-colors"
          >
            {content.declineLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
