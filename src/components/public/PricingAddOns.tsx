'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { AddToCartButton } from '@/components/public/Cart'

// ── Data ──────────────────────────────────────────────────────────────────────

type Plan = {
  id: string
  icon: string
  name: string
  price: number
  badge: string
  popular: boolean
  description: string
  features: string[]
  goodFor: string
  href: string
}

const itPlans: Plan[] = [
  {
    id: 'basic',
    icon: '🖥️',
    name: 'L1 Basic Support',
    price: 49,
    badge: 'Starter',
    popular: false,
    description: 'First-level tech support for very small teams. Everyday computer problems handled so your team stays productive.',
    features: [
      '3 support tickets per month',
      'Up to 2 team members covered',
      'Password reset assistance',
      'Browser & software troubleshooting',
      'Printer & scanner help',
      'Basic connectivity checks',
      'Email support channel',
      'Remote support (limited)',
    ],
    goodFor: 'Solo operators and 1–2 person teams that occasionally hit tech roadblocks.',
    href: '/order/it-support?plan=basic',
  },
  {
    id: 'team',
    icon: '👥',
    name: 'L1 Team Support',
    price: 99,
    badge: 'Most Popular',
    popular: true,
    description: "Full remote support for small teams. We connect directly to your team's computers and fix issues on the spot. No need to bring devices anywhere.",
    features: [
      '8 support tickets per month',
      'Up to 5 team members covered',
      'Full remote desktop support',
      'Windows OS troubleshooting',
      'Email & Outlook issues resolved',
      'Browser & software problems fixed',
      'Printer, scanner & peripheral help',
      'Escalation notes for complex issues',
    ],
    goodFor: 'Teams of 2–5 people dealing with regular tech issues — printers, email, slow computers.',
    href: '/order/it-support?plan=team',
  },
  {
    id: 'office',
    icon: '🏢',
    name: 'L1 Office Support',
    price: 179,
    badge: 'Full Coverage',
    popular: false,
    description: 'Comprehensive support for small offices. Priority response and a monthly report so you always know what we handled.',
    features: [
      '15 support tickets per month',
      'Up to 10 team members covered',
      'Full remote desktop support',
      'Priority response time',
      'Monthly IT issue summary report',
      'Basic device troubleshooting',
      'Windows & software support',
      'All L1 Team features included',
    ],
    goodFor: 'Small offices of 5–10 staff where tech issues happen regularly and downtime costs money.',
    href: '/order/it-support?plan=office',
  },
]

const socialPlans: Plan[] = [
  {
    id: 'starter',
    icon: '📱',
    name: 'Social Starter',
    price: 29,
    badge: 'Entry Level',
    popular: false,
    description: 'Stay visible on social media every month without spending hours creating content. We design the graphics, you just post them.',
    features: [
      '2 custom posts or stories per month',
      'Facebook & Instagram sizing',
      'Branded to your business colors',
      'Promotional or informational content',
      'High resolution files delivered',
      'Ready to post — no editing needed',
    ],
    goodFor: 'Small businesses that want a social media presence without the time commitment.',
    href: '/order/social-media?plan=starter',
  },
  {
    id: 'business',
    icon: '📊',
    name: 'Social Business',
    price: 59,
    badge: 'Most Popular',
    popular: true,
    description: 'Regular branded content plus a website banner every month. Perfect for businesses running promotions, events, or seasonal offers.',
    features: [
      '6 custom posts or stories per month',
      '1 website banner or graphic per month',
      'Facebook, Instagram & other platforms',
      'Promotions, events, announcements',
      'Seasonal and holiday content',
      'Consistent brand look and feel',
      'Files delivered ready to use',
    ],
    goodFor: 'Businesses running regular promotions or events that want professional visuals every month.',
    href: '/order/social-media?plan=business',
  },
  {
    id: 'growth',
    icon: '📈',
    name: 'Social Growth',
    price: 99,
    badge: 'Best Value',
    popular: false,
    description: '12 pieces of content plus 2 banners means something fresh to post every week. Keeps your audience engaged and brand looking professional.',
    features: [
      '12 custom posts or stories per month',
      '2 website banners or graphics per month',
      'All major social platforms',
      'Full monthly content design support',
      'Product showcases, promos, stories',
      'Consistent brand identity throughout',
      'Priority design turnaround',
      'Revisions included',
    ],
    goodFor: 'Brands that take social media seriously and need fresh professional content every week.',
    href: '/order/social-media?plan=growth',
  },
]

const designServices: [string, string][] = [
  ['Basic Logo Design', '$10–$30'],
  ['Flyer or Event Poster', '$5–$15'],
  ['Website Banner', '$5–$10'],
  ['Social Media Banner Pack (5)', '$30'],
  ['Business Card Design', '$5–$15'],
  ['Brand Starter Kit (logo + colors + fonts)', 'from $100'],
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBadgeStyle(badge: string): CSSProperties {
  if (badge === 'Most Popular') return { background: '#dbeafe', color: '#1d4ed8' }
  if (badge === 'Full Coverage') return { background: '#d1fae5', color: '#065f46' }
  if (badge === 'Best Value')    return { background: '#ede9fe', color: '#7c3aed' }
  return { background: '#f1f5f9', color: '#475569' }
}

// ── PlanCard (vertical, fits a 3-column grid) ──────────────────────────────────

interface PlanCardProps {
  plan: Plan
  section: 'it' | 'social'
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function PlanCard({ plan, section, isHovered, onMouseEnter, onMouseLeave }: PlanCardProps) {
  const accent = section === 'it' ? '#2563eb' : '#7c3aed'
  const topGradient = section === 'it'
    ? 'linear-gradient(90deg, #2563eb, #7c3aed)'
    : 'linear-gradient(90deg, #7c3aed, #ec4899)'
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
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: -2, left: -2, right: -2,
        height: 4,
        borderRadius: '16px 16px 0 0',
        background: topGradient,
        zIndex: 1,
        opacity: plan.popular || isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }} />

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
        }}>★ Most Popular</div>
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
        {plan.name}
      </div>

      <div style={{ marginBottom: 10 }}>
        <span style={{
          ...getBadgeStyle(plan.badge),
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 100,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          display: 'inline-block',
        }}>
          {plan.badge}
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
        +${plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>/mo</span>
      </div>

      <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
        {plan.description}
      </div>

      <div style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.07em',
        color: '#94a3b8',
        marginBottom: 12,
      }}>
        {"What's included"}
      </div>

      <div style={{ flex: 1, marginBottom: 16 }}>
        {plan.features.map((feature, i) => (
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
        <strong style={{ color: '#64748b', fontStyle: 'normal' }}>Good for:</strong>{' '}
        {plan.goodFor}
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
        Get Started →
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <>
      {/* ── L1 IT SUPPORT ─────────────────────────────────────────────────── */}
      <section id="it-support" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader
            label="Optional Add-On"
            labelColor="#2563eb"
            title="L1 IT Support"
            subtitle="First-level tech support for your team — passwords, software, printers, email and connectivity. Available as a standalone plan."
            noteText="✓ Available as standalone plan — no website needed"
            noteStyle={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
          />

          <div style={gridStyle}>
            {itPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                section="it"
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
            label="Optional Add-On"
            labelColor="#7c3aed"
            title="Social Media & Design"
            subtitle="Regular branded graphic design for your brand — posts, stories, and website banners every month. Available as a standalone plan."
            noteText="✓ Available as standalone plan — no website needed"
            noteStyle={{ background: '#fdf4ff', border: '1px solid #e9d5ff', color: '#7c3aed' }}
          />

          <div style={gridStyle}>
            {socialPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                section="social"
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
                    One-Time Graphic Design Services
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    Billed once per project — not part of any monthly plan
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
                Request a Quote →
              </Link>
            </div>

            {designServices.map(([service, price], i) => (
              <div
                key={service}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 32px',
                  borderBottom: i < designServices.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                }}
              >
                <span style={{ fontSize: 14, color: '#374151' }}>{service}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', whiteSpace: 'nowrap' as const }}>
                  {price}
                </span>
              </div>
            ))}

            <div style={{ padding: '14px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                Custom quote available for larger or more complex projects.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
