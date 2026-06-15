'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePlans } from '@/lib/usePlans'

const cards = [
  {
    id: 'website',
    accent: '#2563eb',
    iconBg: '#eff6ff',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    noteBg: '#eff6ff',
    noteText: '#1d4ed8',
    badge: 'New Website',
    icon: '🌐',
    title: 'Build a New Website',
    description: 'We design and build your website from scratch. You own it completely. Choose a care plan after to include hosting and maintenance.',
    items: [
      'Starter from $150 · Business from $250',
      'Premium from $350 · E-commerce from $600',
      'Delivered in 5–14 business days',
      'You own the website 100%',
    ],
    note: '💡 Add a Website Care Plan after to include hosting',
    button: 'Build My Website →',
    href: '/order?package=business-site&step=1',
    tag: 'One-time project fee',
  },
  {
    id: 'care',
    accent: '#16a34a',
    iconBg: '#f0fdf4',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
    noteBg: '#f0fdf4',
    noteText: '#166534',
    badge: 'Already Have a Website?',
    icon: '🛡️',
    title: 'Maintain Your Website',
    description: 'Already have a website? We keep it secure, updated, and running smoothly every month. Hosting is included in all care plans.',
    items: [
      'Basic Care $29/mo — backups & security',
      'Content Care $49/mo — + 30min updates',
      'Growth Care $100/mo — + 1hr updates',
      'Full Care $150/mo — + 2hrs updates',
      '🏠 Hosting included in all plans',
    ],
    note: '✅ No website build needed — works with your existing site',
    button: 'View Care Plans →',
    href: '/order/website-care',
    tag: 'Monthly subscription',
  },
  {
    id: 'it',
    accent: '#0f1f3d',
    iconBg: '#f1f5f9',
    badgeBg: '#f1f5f9',
    badgeText: '#475569',
    noteBg: '#f0fdf4',
    noteText: '#166534',
    badge: 'For Teams',
    icon: '🖥️',
    title: 'IT Support for Your Team',
    description: 'First-level tech support for your business team. Passwords, software, printers, browser issues, and basic connectivity — all handled remotely.',
    items: [
      'Basic Support $49/mo — 3 tickets, 2 users',
      'Team Support $99/mo — 8 tickets, 5 users',
      'Office Support $179/mo — 15 tickets, 10 users',
      'Remote support included',
      'No website needed',
    ],
    note: '✅ Standalone plan — completely independent from website services',
    button: 'Get IT Support →',
    href: '/order/it-support',
    tag: 'Monthly subscription',
  },
  {
    id: 'social',
    accent: '#7c3aed',
    iconBg: '#f5f3ff',
    badgeBg: '#ede9fe',
    badgeText: '#5b21b6',
    noteBg: '#f0fdf4',
    noteText: '#166534',
    badge: 'For Brands',
    icon: '🎨',
    title: 'Social Media & Graphic Design',
    description: 'Monthly branded content for your social media. Posts, stories, banners, and graphics designed for your brand — you just post them.',
    items: [
      'Social Starter $29/mo — 2 posts/stories',
      'Social Business $59/mo — 6 posts + 1 banner',
      'Social Growth $99/mo — 12 posts + 2 banners',
      'Custom branded graphics',
      'No website needed',
    ],
    note: '✅ Standalone plan — completely independent from website services',
    button: 'View Design Plans →',
    href: '/order/social-media',
    tag: 'Monthly subscription',
  },
]

export function ServiceCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Live prices from the admin-managed plans (fall back to the static text)
  const apiPlans = usePlans()
  const price = (id: string, fallback: number) =>
    apiPlans.find(p => p.id === id)?.effective_price ?? fallback

  const liveItems: Record<string, string[]> = {
    website: [
      `Starter from $${price('starter-site', 150)} · Business from $${price('business-site', 250)}`,
      `Premium from $${price('premium-site', 350)} · E-commerce from $${price('ecommerce-store', 600)}`,
      'Delivered in 5–14 business days',
      'You own the website 100%',
    ],
    care: [
      `Basic Care $${price('basic-care', 29)}/mo — backups & security`,
      `Content Care $${price('content-care', 49)}/mo — + 30min updates`,
      `Growth Care $${price('growth-care', 100)}/mo — + 1hr updates`,
      `Full Care $${price('full-care', 150)}/mo — + 2hrs updates`,
      '🏠 Hosting included in all plans',
    ],
    it: [
      `Basic Support $${price('it-basic', 49)}/mo — 3 tickets, 2 users`,
      `Team Support $${price('it-team', 99)}/mo — 8 tickets, 5 users`,
      `Office Support $${price('it-office', 179)}/mo — 15 tickets, 10 users`,
      'Remote support included',
      'No website needed',
    ],
    social: [
      `Social Starter $${price('social-starter', 29)}/mo — 2 posts/stories`,
      `Social Business $${price('social-business', 59)}/mo — 6 posts + 1 banner`,
      `Social Growth $${price('social-growth', 99)}/mo — 12 posts + 2 banners`,
      'Custom branded graphics',
      'No website needed',
    ],
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
            OUR SERVICES
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#0f1f3d', marginBottom: 14, fontFamily: 'var(--font-outfit, Outfit, sans-serif)', lineHeight: 1.15 }}>
            What Does Your Business Need?
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 32px' }}>
            Choose the service that fits your situation. Each path is completely independent — you don&apos;t need a website to get IT support or social media design.
          </p>

          {/* Category pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 0 }}>
            {[
              { label: '🌐 New Website',         color: '#dbeafe', text: '#1d4ed8' },
              { label: '🛡️ Website Maintenance', color: '#dcfce7', text: '#166534' },
              { label: '🖥️ IT Support',           color: '#f1f5f9', text: '#475569' },
              { label: '🎨 Design & Social',      color: '#ede9fe', text: '#5b21b6' },
            ].map(tag => (
              <span key={tag.label} style={{ background: tag.color, color: tag.text, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 100 }}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* 2×2 Cards grid */}
        <div className="sc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
          {cards.map(card => {
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
                  {card.badge}
                </span>

                {/* Icon circle */}
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, background: card.iconBg }}>
                  {card.icon}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', marginBottom: 10, fontFamily: 'var(--font-outfit, Outfit, sans-serif)', lineHeight: 1.2 }}>
                  {card.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>
                  {card.description}
                </p>

                {/* Preview list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', flex: 1 }}>
                  {(liveItems[card.id] || card.items).map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 13, color: '#374151' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.accent, flexShrink: 0, marginTop: 5 }} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Note box */}
                <div style={{ marginTop: 'auto', marginBottom: 14, padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: card.noteBg, color: card.noteText }}>
                  {card.note}
                </div>

                {/* Button */}
                <Link
                  href={card.href}
                  className="sc-btn"
                  style={{ display: 'block', padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'center' as const, textDecoration: 'none', color: 'white', background: card.accent, boxSizing: 'border-box' as const }}
                >
                  {card.button}
                </Link>

                {/* Bottom tag */}
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {card.tag}
                </div>
              </div>
            )
          })}
        </div>

        {/* "Not sure?" note */}
        <div style={{ textAlign: 'center', padding: '20px 24px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#0f1f3d' }}>Not sure what you need?</strong>
            {' '}Get a free website review and we&apos;ll recommend the right service for your business.
          </div>
          <Link
            href="/review"
            style={{ display: 'inline-block', marginTop: 12, padding: '10px 22px', background: '#0f1f3d', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            Get Free Review →
          </Link>
        </div>

      </div>
    </section>
  )
}
