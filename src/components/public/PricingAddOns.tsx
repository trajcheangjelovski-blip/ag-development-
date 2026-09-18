'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { CSSProperties } from 'react'
import { usePlans } from '@/lib/usePlans'
import { formatPrice } from '@/lib/money'
import { AddToCartButton } from '@/components/public/Cart'

// ── Visual/numeric metadata only — all copy comes from the message catalog ─────

type PlanMeta = {
  id: string
  icon: string
  price: number      // USD fallback if no live plan
  tone: 'slate' | 'blue' | 'emerald' | 'violet'
  popular: boolean
  href: string
}

const itPlans: PlanMeta[] = [
  { id: 'basic',  icon: '🖥️', price: 49,  tone: 'slate',   popular: false, href: '/order/it-support?plan=basic' },
  { id: 'team',   icon: '👥', price: 99,  tone: 'blue',    popular: true,  href: '/order/it-support?plan=team' },
  { id: 'office', icon: '🏢', price: 179, tone: 'emerald', popular: false, href: '/order/it-support?plan=office' },
]

const socialPlans: PlanMeta[] = [
  { id: 'starter',  icon: '📱', price: 29, tone: 'slate',  popular: false, href: '/order/social-media?plan=starter' },
  { id: 'business', icon: '📊', price: 59, tone: 'blue',   popular: true,  href: '/order/social-media?plan=business' },
  { id: 'growth',   icon: '📈', price: 99, tone: 'violet', popular: false, href: '/order/social-media?plan=growth' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toneStyle(tone: PlanMeta['tone']): CSSProperties {
  if (tone === 'blue')    return { background: '#dbeafe', color: '#1d4ed8' }
  if (tone === 'emerald') return { background: '#d1fae5', color: '#065f46' }
  if (tone === 'violet')  return { background: '#ede9fe', color: '#7c3aed' }
  return { background: '#f1f5f9', color: '#475569' }
}

// ── PlanCard (vertical, fits a 3-column grid) ──────────────────────────────────

interface PlanCardProps {
  plan: PlanMeta
  section: 'it' | 'social'
  displayPrice: string
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function PlanCard({ plan, section, displayPrice, isHovered, onMouseEnter, onMouseLeave }: PlanCardProps) {
  // 'it' cards read from the 'pricing.it' catalog, 'social' from 'pricing.design'.
  const tCard = useTranslations(section === 'it' ? 'pricing.it' : 'pricing.design')
  const tp = useTranslations('pricing')
  const t = useTranslations('pricingPage.addons')

  const accent = section === 'it' ? '#2563eb' : '#7c3aed'
  const hoverBorder = section === 'it' ? '#93c5fd' : '#d8b4fe'
  const popularShadow = section === 'it' ? 'rgba(37,99,235,0.12)' : 'rgba(124,58,237,0.12)'

  let btnBg: string, btnActiveBg: string, btnShadow: string
  if (plan.popular && section === 'it') {
    btnBg = '#2563eb'; btnActiveBg = '#1d4ed8'; btnShadow = '0 4px 16px rgba(37,99,235,0.4)'
  } else if (plan.popular && section === 'social') {
    btnBg = '#7c3aed'; btnActiveBg = '#6d28d9'; btnShadow = '0 4px 16px rgba(124,58,237,0.4)'
  } else {
    btnBg = '#0f1f3d'; btnActiveBg = '#1e3a5f'; btnShadow = 'none'
  }

  const features = tCard.raw(`${plan.id}.features`) as string[]

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: isHovered ? '#fafcff' : 'white',
        border: `2px solid ${isHovered ? hoverBorder : plan.popular ? accent : '#e2e8f0'}`,
        borderRadius: 16,
        padding: '28px 24px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0px)',
        boxShadow: isHovered
          ? '0 16px 48px rgba(0,0,0,0.12)'
          : plan.popular ? `0 8px 30px ${popularShadow}` : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Most Popular ribbon */}
      {plan.popular && (
        <div style={{
          position: 'absolute',
          top: -12, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: accent,
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          padding: '4px 12px',
          borderRadius: 100,
          whiteSpace: 'nowrap' as const,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{tp('mostPopular')}</div>
      )}

      <div style={{
        fontSize: 30,
        marginBottom: 10,
        display: 'inline-block',
        transition: 'transform 0.2s ease',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transformOrigin: 'left center',
      }}>{plan.icon}</div>

      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1f3d', marginBottom: 8, lineHeight: 1.3 }}>
        {tCard(`${plan.id}.name`)}
      </div>

      <div style={{ marginBottom: 10 }}>
        <span style={{
          ...toneStyle(plan.tone),
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 100,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          display: 'inline-block',
        }}>
          {tCard(`${plan.id}.badge`)}
        </span>
      </div>

      <div style={{
        fontSize: 30,
        fontWeight: 800,
        color: accent,
        lineHeight: 1,
        marginBottom: 12,
        display: 'inline-block',
        transition: 'transform 0.2s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'left center',
      }}>
        +{displayPrice}<span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>{tp('perMo')}</span>
      </div>

      <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
        {tCard(`${plan.id}.description`)}
      </div>

      <div style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.07em',
        color: '#94a3b8',
        marginBottom: 12,
      }}>
        {t('whatsIncluded')}
      </div>

      <div style={{ flex: 1, marginBottom: 16 }}>
        {features.map((feature, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
            <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{feature}</span>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 11,
        color: '#94a3b8',
        lineHeight: 1.55,
        marginBottom: 16,
        paddingTop: 14,
        borderTop: '1px solid #f1f5f9',
      }}>
        <strong style={{ color: '#64748b', fontStyle: 'normal' }}>{t('goodFor')}</strong>{' '}
        {tCard(`${plan.id}.goodFor`)}
      </div>

      <a
        href={plan.href}
        style={{
          display: 'block',
          padding: '12px 18px',
          background: isHovered ? btnActiveBg : btnBg,
          color: 'white',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center' as const,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? btnShadow : 'none',
        }}
      >
        {t('getStarted')}
      </a>
      <div style={{ marginTop: 8 }}>
        <AddToCartButton id={section === 'it' ? `it-${plan.id}` : `social-${plan.id}`} />
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, labelColor, title, subtitle, noteText, noteStyle }: {
  label: string
  labelColor: string
  title: string
  subtitle: string
  noteText: string
  noteStyle: CSSProperties
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <div style={{
        fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        color: labelColor,
        marginBottom: 12,
      }}>{label}</div>
      <h2 className="font-display" style={{
        fontSize: 36, fontWeight: 800,
        color: '#0f1f3d',
        margin: '0 0 12px',
        lineHeight: 1.2,
      }}>{title}</h2>
      <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto 18px' }}>
        {subtitle}
      </p>
      <div style={{
        ...noteStyle,
        display: 'inline-block',
        borderRadius: 100,
        padding: '8px 18px',
        fontSize: 12.5,
        fontWeight: 600,
      }}>
        {noteText}
      </div>
    </div>
  )
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
  gap: 24,
  alignItems: 'start',
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PricingAddOns() {
  const t = useTranslations('pricingPage.addons')
  const tp = useTranslations('pricing')
  const locale = useLocale()
  const isMk = locale === 'mk'
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const apiPlans = usePlans()
  const price = (id: string, fallback: number) =>
    apiPlans.find(p => p.id === id)?.effective_price ?? fallback
  const money = (id: string, fb: number) => formatPrice(price(id, fb), isMk ? 'MKD' : 'USD', locale)

  const designRows = t.raw('design.rows') as { service: string; price: string }[]

  return (
    <>
      {/* ── L1 IT SUPPORT ─────────────────────────────────────────────────── */}
      <section id="it-support" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader
            label={t('label')}
            labelColor="#2563eb"
            title={t('itTitle')}
            subtitle={t('itSubtitle')}
            noteText={tp('standalone')}
            noteStyle={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
          />

          <div style={gridStyle}>
            {itPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                section="it"
                displayPrice={money(`it-${plan.id}`, plan.price)}
                isHovered={hoveredCard === `it-${plan.id}`}
                onMouseEnter={() => setHoveredCard(`it-${plan.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL MEDIA & DESIGN ─────────────────────────────────────────── */}
      <section id="social-media" style={{ padding: '80px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader
            label={t('label')}
            labelColor="#7c3aed"
            title={t('socialTitle')}
            subtitle={t('socialSubtitle')}
            noteText={tp('standalone')}
            noteStyle={{ background: '#fdf4ff', border: '1px solid #e9d5ff', color: '#7c3aed' }}
          />

          <div style={gridStyle}>
            {socialPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                section="social"
                displayPrice={money(`social-${plan.id}`, plan.price)}
                isHovered={hoveredCard === `social-${plan.id}`}
                onMouseEnter={() => setHoveredCard(`social-${plan.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
              />
            ))}
          </div>

          {/* One-time graphic design services */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginTop: 48,
          }}>
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>🎨</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>
                    {t('design.title')}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    {t('design.subtitle')}
                  </div>
                </div>
              </div>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px',
                  background: '#0f1f3d', color: 'white',
                  borderRadius: 9, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {t('design.cta')}
              </Link>
            </div>

            {designRows.map((row, i) => (
              <div
                key={row.service}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 32px',
                  borderBottom: i < designRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                }}
              >
                <span style={{ fontSize: 14, color: '#374151' }}>{row.service}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', whiteSpace: 'nowrap' as const }}>
                  {row.price}
                </span>
              </div>
            ))}

            <div style={{ padding: '14px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                {t('design.footnote')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
