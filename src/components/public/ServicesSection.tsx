'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

// Visual/structural metadata only — all text comes from the message catalog.
const serviceMeta = [
  { id: 'website-dev',      icon: '🌐', iconBg: '#eff6ff', accent: '#2563eb', badgeBg: '#dbeafe', badgeText: '#1d4ed8', href: '/pricing#website-build' },
  { id: 'website-care',     icon: '🛡️', iconBg: '#f0fdf4', accent: '#16a34a', badgeBg: '#dcfce7', badgeText: '#166534', href: '/order/website-care' },
  { id: 'it-support',       icon: '💻', iconBg: '#f1f5f9', accent: '#334155', badgeBg: '#e2e8f0', badgeText: '#334155', href: '/order/it-support' },
  { id: 'social-media',     icon: '🎨', iconBg: '#fdf4ff', accent: '#7c3aed', badgeBg: '#ede9fe', badgeText: '#5b21b6', href: '/order/social-media' },
  { id: 'business-email',   icon: '📧', iconBg: '#fff7ed', accent: '#ea580c', badgeBg: '#fed7aa', badgeText: '#9a3412', href: '/contact?service=business-email' },
  { id: 'domain-dns',       icon: '🌍', iconBg: '#f0fdf4', accent: '#0f766e', badgeBg: '#ccfbf1', badgeText: '#0f766e', href: '/contact?service=domain-dns' },
  { id: 'graphic-design',   icon: '🖼️', iconBg: '#fff1f2', accent: '#9f1239', badgeBg: '#fecdd3', badgeText: '#9f1239', href: '/contact?service=graphic-design' },
  { id: 'custom-platforms', icon: '⚡', iconBg: '#fefce8', accent: '#92400e', badgeBg: '#fef08a', badgeText: '#854d0e', href: '/contact?service=custom-platform' },
] as const

export function ServicesSection() {
  const t = useTranslations('servicesSection')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <section style={{ padding: '80px 24px', background: 'white' }}>
      <style>{`
        @media (max-width: 1023px) {
          .ss-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .ss-grid { grid-template-columns: 1fr !important; }
        }
        .ss-btn-ghost {
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease !important;
        }
        .ss-btn-ghost:hover {
          transform: translateY(-2px) scale(1.02);
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.6) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .ss-btn-ghost:active {
          transform: translateY(0) scale(0.98);
        }
        .ss-btn-primary {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease !important;
        }
        .ss-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 32px rgba(37,99,235,0.55) !important;
          filter: brightness(1.12);
        }
        .ss-btn-primary:active {
          transform: translateY(0) scale(0.98);
          filter: brightness(0.97);
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, maxWidth: 700 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#2563eb', marginBottom: 12 }}>
            {t('eyebrow')}
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: '#0f1f3d', marginBottom: 14, fontFamily: 'var(--font-display, Outfit, sans-serif)', lineHeight: 1.15 }}>
            {t('title')}
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, maxWidth: 640, margin: '0 0 12px' }}>
            {t('p1')}
          </p>
          <p style={{ fontSize: 16, color: '#334155', lineHeight: 1.8, maxWidth: 640, margin: 0, fontWeight: 500 }}>
            {t('p2')}
          </p>
        </div>

        {/* Cards grid */}
        <div className="ss-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {serviceMeta.map(card => {
            const hov = hoveredCard === card.id
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '28px 24px',
                  position: 'relative' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hov ? '0 16px 40px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                }}
              >
                {/* Top color bar */}
                <div style={{
                  position: 'absolute',
                  top: -1, left: -1, right: -1,
                  height: hov ? 4 : 2,
                  borderRadius: '16px 16px 0 0',
                  background: card.accent,
                  transition: 'height 0.2s ease',
                  zIndex: 1,
                }} />

                {/* Badge */}
                <span style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 100,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  background: card.badgeBg,
                  color: card.badgeText,
                }}>
                  {t(`services.${card.id}.badge`)}
                </span>

                {/* Icon */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 14,
                  background: card.iconBg,
                  transition: 'transform 0.2s ease',
                  transform: hov ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {card.icon}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: '#94a3b8',
                  marginBottom: 6,
                }}>
                  {t(`services.${card.id}.subtitle`)}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#0f1f3d',
                  marginBottom: 8,
                  fontFamily: 'var(--font-display, Outfit, sans-serif)',
                }}>
                  {t(`services.${card.id}.title`)}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: 13,
                  color: '#64748b',
                  lineHeight: 1.7,
                  flex: 1,
                  marginBottom: 16,
                }}>
                  {t(`services.${card.id}.description`)}
                </p>

                {/* CTA link */}
                <Link
                  href={card.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: hov ? 8 : 5,
                    fontSize: 13,
                    fontWeight: 600,
                    color: card.accent,
                    textDecoration: 'none',
                    marginTop: 'auto' as const,
                    transition: 'gap 0.2s ease',
                  }}
                >
                  {t(`services.${card.id}.cta`)}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Custom plan box — full width */}
        <div style={{
          marginTop: 48,
          borderRadius: 24,
          overflow: 'hidden' as const,
          background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)',
          padding: 'clamp(32px, 5vw, 56px)',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' as const }}>
            <h3 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: 'white', marginBottom: 18, fontFamily: 'var(--font-display, Outfit, sans-serif)', lineHeight: 1.2 }}>
              {t('customTitle')}
            </h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 14 }}>
              {t('customP1')}
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 14 }}>
              {t('customP2')}
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.8, marginBottom: 28, fontWeight: 600 }}>
              {t('customP3')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 14, justifyContent: 'center' }}>
              <Link
                href="/services"
                className="ss-btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 30px',
                  background: 'transparent',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {t('ctaAll')}
              </Link>
              <Link
                href="/order/custom-plan"
                className="ss-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 30px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                }}
              >
                {t('ctaBuild')}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
