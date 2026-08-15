'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AddToCartButton } from '@/components/public/Cart'

type TabId = 'build' | 'care' | 'it' | 'design' | 'custom'

// ── Visual/numeric metadata only — text comes from the 'pricing' catalog ──────

const buildMeta = [
  { id: 'starter-site',    originalPrice: 200, salePrice: 150, discountAmount: 50,  icon: '📄', badgeColor: 'bg-slate-100 text-slate-600',   popular: false, topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)' },
  { id: 'business-site',   originalPrice: 300, salePrice: 250, discountAmount: 50,  icon: '🌐', badgeColor: 'bg-blue-600 text-white',         popular: true,  topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)' },
  { id: 'premium-site',    originalPrice: 450, salePrice: 350, discountAmount: 100, icon: '⭐', badgeColor: 'bg-violet-100 text-violet-700',  popular: false, topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)' },
  { id: 'ecommerce-store', originalPrice: 800, salePrice: 600, discountAmount: 200, icon: '🛒', badgeColor: 'bg-emerald-100 text-emerald-700', popular: false, topGradient: 'linear-gradient(90deg, #10b981, #0d9488)' },
]

const careMeta = [
  { id: 'basic-care',   price: 29,  icon: '🛡️', badgeColor: 'bg-slate-100 text-slate-600',    popular: false, topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)' },
  { id: 'content-care', price: 49,  icon: '✏️', badgeColor: 'bg-blue-600 text-white',          popular: true,  topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)' },
  { id: 'growth-care',  price: 100, icon: '🎨', badgeColor: 'bg-violet-100 text-violet-700',   popular: false, topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)' },
  { id: 'full-care',    price: 150, icon: '🚀', badgeColor: 'bg-emerald-100 text-emerald-700', popular: false, topGradient: 'linear-gradient(90deg, #10b981, #0d9488)' },
]

const itMeta = [
  { id: 'basic',  price: 49,  icon: '🖥️', badgeColor: 'bg-slate-100 text-slate-600',    popular: false, topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)', buttonColor: null as string | null,  href: '/order/it-support?plan=basic' },
  { id: 'team',   price: 99,  icon: '👥', badgeColor: 'bg-blue-600 text-white',          popular: true,  topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)', buttonColor: '#2563eb' as string | null, href: '/order/it-support?plan=team' },
  { id: 'office', price: 179, icon: '🏢', badgeColor: 'bg-emerald-100 text-emerald-700', popular: false, topGradient: 'linear-gradient(90deg, #10b981, #0d9488)', buttonColor: null as string | null,  href: '/order/it-support?plan=office' },
]

const designMeta = [
  { id: 'starter',  price: 29, icon: '📱', badgeColor: 'bg-slate-100 text-slate-600',   popular: false, topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)', buttonColor: null as string | null,  href: '/order/social-media?plan=starter' },
  { id: 'business', price: 59, icon: '📊', badgeColor: 'bg-blue-600 text-white',         popular: true,  topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)', buttonColor: '#7c3aed' as string | null, href: '/order/social-media?plan=business' },
  { id: 'growth',   price: 99, icon: '📈', badgeColor: 'bg-violet-100 text-violet-700',  popular: false, topGradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)', buttonColor: null as string | null,  href: '/order/social-media?plan=growth' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Check() { return <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> }

// ── Tab content ───────────────────────────────────────────────────────────────

function BuildTab({ onSwitchToCare }: { onSwitchToCare: () => void }) {
  const t = useTranslations('pricing')
  const [hoveredBuildCard, setHoveredBuildCard] = useState<string | null>(null)

  return (
    <>
      <div className="rounded-xl mb-7 px-5 py-3 flex items-center justify-center gap-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)' }}>
        <span className="text-yellow-300">🎉</span>
        <span>{t('buildBanner')}</span>
        <span className="text-yellow-300">🎉</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {buildMeta.map(p => {
          const hov = hoveredBuildCard === p.id
          const features = t.raw(`build.${p.id}.features`) as string[]
          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredBuildCard(p.id)}
              onMouseLeave={() => setHoveredBuildCard(null)}
              style={{
                position: 'relative', background: 'white', borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`, padding: 24,
                display: 'flex', flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov ? (p.popular ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)' : '0 16px 48px rgba(0,0,0,0.10)') : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : 'none'),
                transition: 'all 0.25s ease', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', top: -2, left: -2, right: -2, height: hov ? 5 : 3, background: p.topGradient, transition: 'height 0.2s ease', borderRadius: '16px 16px 0 0', zIndex: 1 }} />

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">{t('mostPopular')}</div>
              )}

              {hov ? (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1f3d', color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, animation: 'fadeIn 0.2s ease both', zIndex: 10, whiteSpace: 'nowrap' }}>{t('clickToOrder')}</div>
              ) : (
                <div className="absolute top-4 right-4">
                  <span className="discount-badge">{t('save', { amount: `$${p.discountAmount}` })}</span>
                </div>
              )}

              <div style={{ fontSize: 30, marginBottom: 12, display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'left center' }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{t(`build.${p.id}.badge`)}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{t(`build.${p.id}.name`)}</div>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>${p.originalPrice}</span>

              <div style={{ fontSize: 42, fontWeight: 800, color: '#0f1f3d', lineHeight: 1, margin: '6px 0 4px', display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'left center' }}>
                ${p.salePrice} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>{t('oneTime')}</span>
              </div>

              <div className="mt-2 mb-4 space-y-0.5">
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('domainNotIncluded')}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  →{' '}
                  <button onClick={onSwitchToCare} className="underline hover:text-blue-500 transition-colors" style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    {t('addCareToInclude')}
                  </button>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>
              <p className="text-xs text-slate-400 italic leading-relaxed mb-4">{t(`build.${p.id}.description`)}</p>
              <div>
                <Link
                  href={`/order?package=${p.id}`}
                  style={{ display: 'block', textAlign: 'center' as const, padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s ease', transform: hov ? 'scale(1.02)' : 'scale(1)', background: (hov || p.popular) ? '#2563eb' : '#f8fafc', color: (hov || p.popular) ? 'white' : '#475569', border: (hov || p.popular) ? '2px solid #2563eb' : '2px solid #e2e8f0', boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none' }}
                >
                  {t('getStarted')}
                </Link>
                <button onClick={onSwitchToCare} className="block w-full text-center mt-1.5 hover:text-blue-500 transition-colors" style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {t('thenAddCare')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.7 }}>
          <strong>{t('buildNoteStrong1')}</strong>{' '}{t('buildNoteText1')}<br />
          <strong style={{ color: '#16a34a' }}>{t('buildNoteStrong2')}</strong>{' '}{t('buildNoteText2')}
        </div>
      </div>
    </>
  )
}

function CareTab() {
  const t = useTranslations('pricing')
  const [hoveredCareCard, setHoveredCareCard] = useState<string | null>(null)

  return (
    <>
      <div className="w-full rounded-xl mb-7 px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #16a34a 0%, #15803d 50%, #16a34a 100%)' }}>
        <span>{t('careBanner')}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {careMeta.map(p => {
          const hov = hoveredCareCard === p.id
          const features = t.raw(`care.${p.id}.features`) as string[]
          const details = t.raw(`care.${p.id}.details`) as { label: string; value: string }[]
          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredCareCard(p.id)}
              onMouseLeave={() => setHoveredCareCard(null)}
              style={{
                position: 'relative', background: 'white', borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`, padding: 24,
                display: 'flex', flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov ? (p.popular ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)' : '0 16px 48px rgba(0,0,0,0.10)') : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : 'none'),
                transition: 'all 0.25s ease', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', top: -2, left: -2, right: -2, height: hov ? 5 : 3, background: p.topGradient, transition: 'height 0.2s ease', borderRadius: '16px 16px 0 0', zIndex: 1 }} />

              {hov && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1f3d', color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, animation: 'fadeIn 0.2s ease both', zIndex: 10, whiteSpace: 'nowrap' }}>{t('clickToOrder')}</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">{t('mostPopular')}</div>
              )}

              <div style={{ fontSize: 30, marginBottom: 12, display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'left center' }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{t(`care.${p.id}.badge`)}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-1">{t(`care.${p.id}.name`)}</div>

              <div style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'left center' }}>
                <div className="font-display text-3xl font-extrabold text-slate-800 mb-1">${p.price}</div>
              </div>
              <div className="text-xs text-slate-400 mb-5">{t('perMonth')}</div>

              <ul className="space-y-1.5 mb-4 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm"><Check /><span className="text-slate-600">{f}</span></li>
                ))}
              </ul>
              {details && details.length > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  {details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < details.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: 11 }}>
                      <span style={{ color: '#64748b' }}>{d.label}</span>
                      <span style={{ fontWeight: 600, color: '#0f1f3d' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 italic leading-relaxed mb-5">{t(`care.${p.id}.description`)}</p>
              <Link
                href="/order/website-care"
                style={{ display: 'block', textAlign: 'center' as const, padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s ease', transform: hov ? 'scale(1.02)' : 'scale(1)', background: (hov || p.popular) ? '#2563eb' : '#f8fafc', color: (hov || p.popular) ? 'white' : '#475569', border: (hov || p.popular) ? '2px solid #2563eb' : '2px solid #e2e8f0', boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none' }}
              >{t('getStarted')}</Link>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.7, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
        <strong>{t('careNoteTitle')}</strong>{' '}{t('careNoteText')}
      </div>
    </>
  )
}

function ITSupportTab() {
  const t = useTranslations('pricing')
  const [hoveredITCard, setHoveredITCard] = useState<string | null>(null)

  return (
    <>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.7 }}>
          {t('itBanner1')}<br />
          <strong style={{ color: '#16a34a' }}>{t('itBanner2')}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {itMeta.map(p => {
          const hov = hoveredITCard === p.id
          const features = t.raw(`it.${p.id}.features`) as string[]
          const btnBg = p.buttonColor ? (hov ? (p.buttonColor === '#2563eb' ? '#1d4ed8' : p.buttonColor) : p.buttonColor) : (hov || p.popular) ? '#2563eb' : '#f8fafc'
          const btnColor = (p.buttonColor || hov || p.popular) ? 'white' : '#475569'
          const btnBorder = (p.buttonColor || hov || p.popular) ? `2px solid ${p.buttonColor || '#2563eb'}` : '2px solid #e2e8f0'

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredITCard(p.id)}
              onMouseLeave={() => setHoveredITCard(null)}
              style={{
                position: 'relative', background: 'white', borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`, padding: 24,
                display: 'flex', flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov ? (p.popular ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)' : '0 12px 36px rgba(0,0,0,0.1)') : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', top: -2, left: -2, right: -2, height: hov ? 5 : 3, background: p.topGradient, transition: 'height 0.2s ease', borderRadius: '16px 16px 0 0', zIndex: 1 }} />

              {hov && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1f3d', color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, animation: 'fadeIn 0.2s ease both', zIndex: 10, whiteSpace: 'nowrap' }}>{t('clickToOrder')}</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">{t('mostPopular')}</div>
              )}

              <div style={{ fontSize: 30, marginBottom: 12, display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'left center' }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{t(`it.${p.id}.badge`)}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{t(`it.${p.id}.name`)}</div>

              <div style={{ fontSize: 42, fontWeight: 800, color: '#0f1f3d', lineHeight: 1, margin: '6px 0 4px', display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'left center' }}>
                ${p.price} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>{t('perMonth')}</span>
              </div>

              <ul className="space-y-1.5 mt-4 mb-5 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{t(`it.${p.id}.description`)}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 3 }}>{t('goodForLabel')}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', lineHeight: 1.55 }}>{t(`it.${p.id}.goodFor`)}</div>
              </div>

              <div>
                <Link
                  href={p.href}
                  style={{ display: 'block', textAlign: 'center' as const, padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s ease', transform: hov ? 'scale(1.02)' : 'scale(1)', background: btnBg, color: btnColor, border: btnBorder, boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none' }}
                >
                  {t('getStarted')}
                </Link>
                <div style={{ marginTop: 8 }}>
                  <AddToCartButton id={`it-${p.id}`} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  {t('standalone')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function DesignSocialTab() {
  const t = useTranslations('pricing')
  const [hoveredDesignCard, setHoveredDesignCard] = useState<string | null>(null)

  return (
    <>
      <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎨</span>
        <div style={{ fontSize: 13, color: '#7c3aed', lineHeight: 1.7 }}>
          {t('designBanner1')}<br />
          <strong style={{ color: '#16a34a' }}>{t('designBanner2')}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {designMeta.map(p => {
          const hov = hoveredDesignCard === p.id
          const features = t.raw(`design.${p.id}.features`) as string[]
          const btnBg = p.buttonColor ? (hov ? (p.buttonColor === '#7c3aed' ? '#6d28d9' : p.buttonColor) : p.buttonColor) : (hov || p.popular) ? '#2563eb' : '#f8fafc'
          const btnColor = (p.buttonColor || hov || p.popular) ? 'white' : '#475569'
          const btnBorder = (p.buttonColor || hov || p.popular) ? `2px solid ${p.buttonColor || '#2563eb'}` : '2px solid #e2e8f0'

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredDesignCard(p.id)}
              onMouseLeave={() => setHoveredDesignCard(null)}
              style={{
                position: 'relative', background: 'white', borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`, padding: 24,
                display: 'flex', flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov ? (p.popular ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)' : '0 12px 36px rgba(0,0,0,0.1)') : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
              }}
            >
              <div style={{ position: 'absolute', top: -2, left: -2, right: -2, height: hov ? 5 : 3, background: p.topGradient, transition: 'height 0.2s ease', borderRadius: '16px 16px 0 0', zIndex: 1 }} />

              {hov && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1f3d', color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, animation: 'fadeIn 0.2s ease both', zIndex: 10, whiteSpace: 'nowrap' }}>{t('clickToOrder')}</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">{t('mostPopular')}</div>
              )}

              <div style={{ fontSize: 30, marginBottom: 12, display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'left center' }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{t(`design.${p.id}.badge`)}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{t(`design.${p.id}.name`)}</div>

              <div style={{ fontSize: 42, fontWeight: 800, color: '#0f1f3d', lineHeight: 1, margin: '6px 0 4px', display: 'inline-block', transition: 'transform 0.2s ease', transform: hov ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'left center' }}>
                ${p.price} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>{t('perMonth')}</span>
              </div>

              <ul className="space-y-1.5 mt-4 mb-5 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{t(`design.${p.id}.description`)}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 3 }}>{t('goodForLabel')}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', lineHeight: 1.55 }}>{t(`design.${p.id}.goodFor`)}</div>
              </div>

              <div>
                <Link
                  href={p.href}
                  style={{ display: 'block', textAlign: 'center' as const, padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s ease', transform: hov ? 'scale(1.02)' : 'scale(1)', background: btnBg, color: btnColor, border: btnBorder, boxShadow: (hov && p.popular) ? '0 0 20px rgba(124,58,237,0.4)' : 'none' }}
                >
                  {t('getStarted')}
                </Link>
                <div style={{ marginTop: 8 }}>
                  <AddToCartButton id={`social-${p.id}`} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  {t('standalone')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function CustomTabContent() {
  const t = useTranslations('pricing')
  const features = t.raw('custom.features') as string[]
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-3xl overflow-hidden grain" style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)' }}>
        <div className="p-10 md:p-14 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{t('custom.eyebrow')}</div>
            <h3 className="font-display text-3xl font-extrabold text-white mb-2">{t('custom.title')}</h3>
            <div className="font-display text-4xl font-extrabold text-white mb-1">{t('custom.fromPrice')}<span className="text-lg font-normal text-white/50">{t('perMo')}</span></div>
            <p className="text-white/55 text-sm mb-6">{t('custom.subtitle')}</p>
            <ul className="space-y-2">
              {features.map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-blue-400 font-bold">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-8">
            <h4 className="font-display font-extrabold text-white text-xl mb-3">{t('custom.boxTitle')}</h4>
            <p className="text-white/55 text-sm leading-relaxed mb-7">{t('custom.boxText')}</p>
            <Link href="/contact" className="block w-full text-center py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-blue-50 transition-all mb-3" style={{ color: '#0f1f3d' }}>{t('custom.cta')}</Link>
            <p className="text-white/35 text-xs leading-relaxed">{t('custom.boxNote')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PricingTabs() {
  const t = useTranslations('pricing')
  const [active, setActive] = useState<TabId>('build')
  const [fading, setFading] = useState(false)
  const [displayed, setDisplayed] = useState<TabId>('build')

  const TABS: TabId[] = ['build', 'care', 'it', 'design', 'custom']

  function switchTab(tab: TabId) {
    if (tab === active || fading) return
    setFading(true)
    setTimeout(() => { setDisplayed(tab); setActive(tab); setFading(false) }, 150)
  }

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-label">{t('label')}</div>
          <h2 className="section-title">{t('title')}</h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">{t('subtitle')}</p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5 flex-wrap justify-center">
            {TABS.map(id => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                style={{ fontSize: 12, padding: '7px 14px' }}
                className={`rounded-lg font-semibold transition-all ${active === id ? 'bg-white text-slate-800 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              >
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="transition-opacity duration-150" style={{ opacity: fading ? 0 : 1 }}>
          {displayed === 'build'  && <BuildTab onSwitchToCare={() => switchTab('care')} />}
          {displayed === 'care'   && <CareTab />}
          {displayed === 'it'     && <ITSupportTab />}
          {displayed === 'design' && <DesignSocialTab />}
          {displayed === 'custom' && <CustomTabContent />}
        </div>

        <div className="text-center mt-10">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors">
            {t('seeFull')}
          </Link>
        </div>
      </div>
    </section>
  )
}
