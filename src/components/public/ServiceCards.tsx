'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { usePlans } from '@/lib/usePlans'
import { formatPrice } from '@/lib/money'

// Visual/structural metadata only — all text comes from the message catalog.
const cardMeta = [
  { id: 'website', accent: '#2563eb', iconBg: '#eff6ff', badgeBg: '#dbeafe', badgeText: '#1d4ed8', noteBg: '#eff6ff', noteText: '#1d4ed8', icon: '🌐', href: '/order?package=business-site&step=1' },
  { id: 'care',    accent: '#16a34a', iconBg: '#f0fdf4', badgeBg: '#dcfce7', badgeText: '#166534', noteBg: '#f0fdf4', noteText: '#166534', icon: '🛡️', href: '/order/website-care' },
  { id: 'it',      accent: '#0f1f3d', iconBg: '#f1f5f9', badgeBg: '#f1f5f9', badgeText: '#475569', noteBg: '#f0fdf4', noteText: '#166534', icon: '🖥️', href: '/order/it-support' },
  { id: 'social',  accent: '#7c3aed', iconBg: '#f5f3ff', badgeBg: '#ede9fe', badgeText: '#5b21b6', noteBg: '#f0fdf4', noteText: '#166534', icon: '🎨', href: '/order/social-media' },
] as const

export function ServiceCards() {
  const t = useTranslations('serviceCards')
  const locale = useLocale()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Live prices from the admin-managed plans (fall back to the static text).
  // Region-aware currency: MK shows denars, everyone else USD.
  const apiPlans = usePlans()
  const price = (id: string, fallback: number) =>
    apiPlans.find(p => p.id === id)?.effective_price ?? fallback
  const money = (id: string, fb: number) => formatPrice(price(id, fb), locale === 'mk' ? 'MKD' : 'USD', locale)

  function itemsFor(id: string): string[] {
    switch (id) {
      case 'website': return [
        t('cards.website.items.i1', { starter: money('starter-site', 150), business: money('business-site', 250) }),
        t('cards.website.items.i2', { premium: money('premium-site', 350), ecommerce: money('ecommerce-store', 600) }),
        t('cards.website.items.i3'),
        t('cards.website.items.i4'),
      ]
      case 'care': return [
        t('cards.care.items.i1', { basic: money('basic-care', 29) }),
        t('cards.care.items.i2', { content: money('content-care', 49) }),
        t('cards.care.items.i3', { growth: money('growth-care', 100) }),
        t('cards.care.items.i4', { full: money('full-care', 150) }),
        t('cards.care.items.i5'),
      ]
      case 'it': return [
        t('cards.it.items.i1', { basic: money('it-basic', 49) }),
        t('cards.it.items.i2', { team: money('it-team', 99) }),
        t('cards.it.items.i3', { office: money('it-office', 179) }),
        t('cards.it.items.i4'),
        t('cards.it.items.i5'),
      ]
      case 'social': return [
        t('cards.social.items.i1', { starter: money('social-starter', 29) }),
        t('cards.social.items.i2', { business: money('social-business', 59) }),
        t('cards.social.items.i3', { growth: money('social-growth', 99) }),
        t('cards.social.items.i4'),
        t('cards.social.items.i5'),
      ]
      default: return []
    }
  }

  return (
    <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
      <style>{`
        @media (max-width: 767px) {
          .sc-grid { grid-template-columns: 1fr !important; }
        }
        .sc-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease !important;
        }
        .sc-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          filter: brightness(1.1);
        }
        .sc-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          filter: brightness(0.97);
        }
      `}</style>

      <div style={{ maxWidth: 1050, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#2563eb', marginBottom: 12 }}>
            {t('eyebrow')}
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#0f1f3d', marginBottom: 14, fontFamily: 'var(--font-outfit, Outfit, sans-serif)', lineHeight: 1.15 }}>
            {t('title')}
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 32px' }}>
            {t('subtitle')}
          </p>

          {/* Category pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 0 }}>
            {[
              { label: t('pills.newWebsite'),  color: '#dbeafe', text: '#1d4ed8' },
              { label: t('pills.maintenance'), color: '#dcfce7', text: '#166534' },
              { label: t('pills.it'),          color: '#f1f5f9', text: '#475569' },
              { label: t('pills.design'),      color: '#ede9fe', text: '#5b21b6' },
            ].map(tag => (
              <span key={tag.label} style={{ background: tag.color, color: tag.text, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 100 }}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* 2×2 Cards grid */}
        <div className="sc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
          {cardMeta.map(card => {
            const hov = hoveredCard === card.id
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: 32,
                  border: hov ? `1px solid ${card.accent}55` : '1px solid #e2e8f0',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  transform: hov ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: hov ? '0 20px 60px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                {/* Top color bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.accent, borderRadius: '20px 20px 0 0' }} />

                {/* Badge */}
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: card.badgeBg, color: card.badgeText }}>
                  {t(`cards.${card.id}.badge`)}
                </span>

                {/* Icon circle */}
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, background: card.iconBg }}>
                  {card.icon}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', marginBottom: 10, fontFamily: 'var(--font-outfit, Outfit, sans-serif)', lineHeight: 1.2 }}>
                  {t(`cards.${card.id}.title`)}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>
                  {t(`cards.${card.id}.description`)}
                </p>

                {/* Preview list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', flex: 1 }}>
                  {itemsFor(card.id).map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.accent, flexShrink: 0, marginTop: 5 }} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Note box */}
                <div style={{ marginTop: 'auto', marginBottom: 14, padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: card.noteBg, color: card.noteText }}>
                  {t(`cards.${card.id}.note`)}
                </div>

                {/* Button */}
                <Link
                  href={card.href}
                  className="sc-btn"
                  style={{ display: 'block', padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center' as const, textDecoration: 'none', color: 'white', background: card.accent, boxSizing: 'border-box' as const }}
                >
                  {t(`cards.${card.id}.button`)}
                </Link>

                {/* Bottom tag */}
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {t(`cards.${card.id}.tag`)}
                </div>
              </div>
            )
          })}
        </div>

        {/* "Not sure?" note */}
        <div style={{ textAlign: 'center', padding: '20px 24px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#0f1f3d' }}>{t('notSureTitle')}</strong>
            {' '}{t('notSureText')}
          </div>
          <Link
            href="/review"
            style={{ display: 'inline-block', marginTop: 12, padding: '10px 22px', background: '#0f1f3d', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            {t('notSureCta')}
          </Link>
        </div>

      </div>
    </section>
  )
}
