'use client'
import { useState } from 'react'
import Link from 'next/link'

type TabId = 'build' | 'care' | 'it' | 'design' | 'custom'

// ── Shared data ───────────────────────────────────────────────────────────────

const buildPackages = [
  {
    id: 'starter-site',
    name: 'Starter Site', originalPrice: 200, salePrice: 150, discount: 'Save $50', icon: '📄',
    badge: 'Simple & Clean', badgeColor: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200', popular: false,
    topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)',
    features: ['1-page professional website', 'Mobile responsive design', 'Contact form', 'Basic SEO setup', 'Google Maps integration', 'Social media links', 'Hosting setup assistance', '1 revision round'],
    description: 'A simple one-page website for freelancers, small businesses, and local service providers who need a clean online presence.',
  },
  {
    id: 'business-site',
    name: 'Business Site', originalPrice: 300, salePrice: 250, discount: 'Save $50', icon: '🌐',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    border: 'border-blue-500', popular: true,
    topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    features: ['Up to 5 pages', 'Home, About, Services, Gallery, Contact', 'Mobile responsive design', 'Contact form + Google Maps', 'Basic SEO setup', 'Speed optimization', 'Social media links', '2 revision rounds'],
    description: 'A complete small business website with the essential pages your company needs to look professional online.',
  },
  {
    id: 'premium-site',
    name: 'Premium Site', originalPrice: 450, salePrice: 350, discount: 'Save $100', icon: '⭐',
    badge: 'More Pages', badgeColor: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200', popular: false,
    topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)',
    features: ['Up to 8 pages', 'Blog or news section', 'Gallery or portfolio', 'Advanced SEO setup', 'Google Analytics setup', 'Speed optimization', 'Core Web Vitals improvement', '3 revision rounds'],
    description: 'A more advanced website for businesses that need more pages, better structure, and stronger online presentation.',
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store', originalPrice: 800, salePrice: 600, discount: 'Save $200', icon: '🛒',
    badge: 'Online Store', badgeColor: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300', popular: false,
    topGradient: 'linear-gradient(90deg, #10b981, #0d9488)',
    features: ['Shopify or WooCommerce setup', 'Up to 20 products added', 'Product pages + categories', 'Cart and checkout setup', 'Payment gateway connection assistance', 'Basic store design', 'Mobile responsive layout', '2 revision rounds'],
    description: 'A complete online store setup for businesses that want to sell products online.',
  },
]

type CareFeature = { text: string; yes: boolean }
type DetailRow = { label: string; value: string }
const carePlans = [
  {
    id: 'basic-care',
    name: 'Basic Care', price: 29, icon: '🛡️',
    badge: 'Essential', badgeColor: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200', popular: false,
    topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)',
    features: [
      { text: 'Web hosting included', yes: true },
      { text: 'Monthly automated backups', yes: true },
      { text: 'Security & plugin updates', yes: true },
      { text: 'Uptime monitoring', yes: true },
      { text: 'Performance checks', yes: true },
      { text: 'Email support', yes: true },
    ] as CareFeature[],
    details: [
      { label: 'Monthly website updates', value: 'Not included' },
      { label: 'First response', value: 'Within 2 business days' },
    ] as DetailRow[],
    description: 'Simple website maintenance for businesses that want their site to stay online, secure, and updated.',
  },
  {
    id: 'content-care',
    name: 'Content Care', price: 49, icon: '✏️',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    border: 'border-blue-500', popular: true,
    topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    features: [
      { text: 'Web hosting included', yes: true },
      { text: 'Everything in Basic Care', yes: true },
      { text: '30 min/month content updates', yes: true },
      { text: 'Update text, images, prices, or hours', yes: true },
      { text: 'Add or edit services', yes: true },
      { text: 'Priority email support', yes: true },
    ] as CareFeature[],
    details: [
      { label: 'Monthly website updates', value: '30 minutes included' },
      { label: 'First response', value: 'Within 1 business day' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ] as DetailRow[],
    description: 'Website care plus small monthly content updates for businesses that need occasional changes.',
  },
  {
    id: 'growth-care',
    name: 'Growth Care', price: 100, icon: '🎨',
    badge: 'Updates + Design', badgeColor: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200', popular: false,
    topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)',
    features: [
      { text: 'Web hosting included', yes: true },
      { text: 'Everything in Content Care', yes: true },
      { text: '1 hour/month website updates', yes: true },
      { text: 'Add/edit services, photos, or new sections', yes: true },
      { text: 'Minor layout improvements', yes: true },
      { text: 'Priority support response', yes: true },
    ] as CareFeature[],
    details: [
      { label: 'Monthly website updates', value: '1 hour included' },
      { label: 'First response', value: 'Within 8 business hours' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ] as DetailRow[],
    description: 'More monthly website support for businesses that update their website regularly.',
  },
  {
    id: 'full-care',
    name: 'Full Care', price: 150, icon: '🚀',
    badge: 'Maximum Support', badgeColor: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300', popular: false,
    topGradient: 'linear-gradient(90deg, #10b981, #0d9488)',
    features: [
      { text: 'Web hosting included', yes: true },
      { text: 'Everything in Growth Care', yes: true },
      { text: '2 hours/month website updates', yes: true },
      { text: 'Priority response time', yes: true },
      { text: 'Monthly update summary report', yes: true },
      { text: 'Minor design improvements', yes: true },
    ] as CareFeature[],
    details: [
      { label: 'Monthly website updates', value: '2 hours included' },
      { label: 'First response', value: 'Within 4 business hours' },
      { label: 'Small update delivery', value: 'Usually 1–3 business days' },
    ] as DetailRow[],
    description: 'Our most complete website care plan for active business websites.',
  },
]

const itPlans = [
  {
    id: 'basic',
    name: 'L1 Basic Support', price: 49, icon: '🖥️',
    badge: 'Starter', badgeColor: 'bg-slate-100 text-slate-600',
    popular: false,
    topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)',
    buttonColor: null as string | null,
    features: [
      '3 support tickets/month',
      'Up to 2 users covered',
      'Password reset assistance',
      'Browser & software help',
      'Printer & scanner troubleshooting',
      'Basic connectivity checks',
      'Email support',
      'Remote support (limited)',
    ],
    description: 'First-level tech support for very small teams. Everyday computer problems handled so your team stays productive.',
    goodFor: 'Solo operators and 1–2 person teams that occasionally hit tech roadblocks.',
    href: '/order/it-support?plan=basic',
  },
  {
    id: 'team',
    name: 'L1 Team Support', price: 99, icon: '👥',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    popular: true,
    topGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    buttonColor: '#2563eb' as string | null,
    features: [
      '8 support tickets/month',
      'Up to 5 users covered',
      'Full remote desktop support',
      'Windows OS troubleshooting',
      'Email & Outlook issues',
      'Browser & software problems',
      'Printer & scanner help',
      'Escalation notes for complex issues',
    ],
    description: 'Full remote support for small teams. We connect directly to your team\'s computers and fix issues on the spot.',
    goodFor: 'Teams of 2–5 people dealing with regular tech issues — printers, email, slow computers.',
    href: '/order/it-support?plan=team',
  },
  {
    id: 'office',
    name: 'L1 Office Support', price: 179, icon: '🏢',
    badge: 'Full Coverage', badgeColor: 'bg-emerald-100 text-emerald-700',
    popular: false,
    topGradient: 'linear-gradient(90deg, #10b981, #0d9488)',
    buttonColor: null as string | null,
    features: [
      '15 support tickets/month',
      'Up to 10 users covered',
      'Full remote desktop support',
      'Priority response time',
      'Monthly IT issue summary report',
      'Basic device troubleshooting',
      'Windows & software support',
      'All L1 Team features included',
    ],
    description: 'Comprehensive support for small offices. Priority response and a monthly report so you always know what we handled.',
    goodFor: 'Small offices of 5–10 staff where tech issues happen regularly.',
    href: '/order/it-support?plan=office',
  },
]

const designPlans = [
  {
    id: 'starter',
    name: 'Social Starter', price: 29, icon: '📱',
    badge: 'Entry Level', badgeColor: 'bg-slate-100 text-slate-600',
    popular: false,
    topGradient: 'linear-gradient(90deg, #94a3b8, #64748b)',
    buttonColor: null as string | null,
    features: [
      '2 custom posts or stories/month',
      'Facebook & Instagram sizing',
      'Branded to your business colors',
      'Promotional or informational content',
      'High resolution files delivered',
      'Ready to post — no editing needed',
    ],
    description: 'Stay visible on social media every month without spending hours creating content yourself.',
    goodFor: 'Small businesses that want a social media presence without the time commitment.',
    href: '/order/social-media?plan=starter',
  },
  {
    id: 'business',
    name: 'Social Business', price: 59, icon: '📊',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    popular: true,
    topGradient: 'linear-gradient(90deg, #7c3aed, #c026d3)',
    buttonColor: '#7c3aed' as string | null,
    features: [
      '6 custom posts or stories/month',
      '1 website banner or graphic/month',
      'Facebook, Instagram & other platforms',
      'Promotions, events, announcements',
      'Seasonal and holiday content',
      'Consistent brand look and feel',
      'Files delivered ready to use',
    ],
    description: 'Regular branded content plus a website banner every month. Perfect for businesses running regular promotions.',
    goodFor: 'Businesses running regular promotions or events that want professional visuals every month.',
    href: '/order/social-media?plan=business',
  },
  {
    id: 'growth',
    name: 'Social Growth', price: 99, icon: '📈',
    badge: 'Best Value', badgeColor: 'bg-violet-100 text-violet-700',
    popular: false,
    topGradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
    buttonColor: null as string | null,
    features: [
      '12 custom posts or stories/month',
      '2 website banners or graphics/month',
      'All major social platforms',
      'Full monthly content design support',
      'Product showcases, promos, stories',
      'Consistent brand identity throughout',
      'Priority design turnaround',
      'Revisions included',
    ],
    description: 'Full monthly design support. Something fresh to post every week, keeping your audience engaged.',
    goodFor: 'Brands that take social media seriously and need fresh professional content every week.',
    href: '/order/social-media?plan=growth',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Check() { return <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> }
function Cross() { return <span className="text-slate-300 font-bold flex-shrink-0">✗</span> }

// ── Tab content ───────────────────────────────────────────────────────────────

function BuildTab({ onSwitchToCare }: { onSwitchToCare: () => void }) {
  const [hoveredBuildCard, setHoveredBuildCard] = useState<string | null>(null)

  return (
    <>
      {/* Limited Time Offer banner */}
      <div className="rounded-xl mb-7 px-5 py-3 flex items-center justify-center gap-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)' }}>
        <span className="text-yellow-300">🎉</span>
        <span>Limited Time Offer — All website builds are currently discounted. Lock in your price today.</span>
        <span className="text-yellow-300">🎉</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {buildPackages.map(p => {
          const hov = hoveredBuildCard === p.id
          return (
            <div
              key={p.name}
              onMouseEnter={() => setHoveredBuildCard(p.id)}
              onMouseLeave={() => setHoveredBuildCard(null)}
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`,
                padding: 24,
                display: 'flex',
                flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov
                  ? (p.popular
                    ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)'
                    : '0 16px 48px rgba(0,0,0,0.10)')
                  : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : 'none'),
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
            >
              {/* Top gradient border */}
              <div style={{
                position: 'absolute',
                top: -2, left: -2, right: -2,
                height: hov ? 5 : 3,
                background: p.topGradient,
                transition: 'height 0.2s ease',
                borderRadius: '16px 16px 0 0',
                zIndex: 1,
              }} />

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">★ Most Popular</div>
              )}

              {hov ? (
                <div style={{
                  position: 'absolute',
                  top: 10, right: 10,
                  background: '#0f1f3d',
                  color: 'white',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  animation: 'fadeIn 0.2s ease both',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}>Click to order</div>
              ) : (
                <div className="absolute top-4 right-4">
                  <span className="discount-badge">{p.discount}</span>
                </div>
              )}

              <div style={{
                fontSize: 30,
                marginBottom: 12,
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{p.name}</div>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>${p.originalPrice}</span>

              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#0f1f3d',
                lineHeight: 1,
                margin: '6px 0 4px',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>
                ${p.salePrice} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>one-time</span>
              </div>

              <div className="mt-2 mb-4 space-y-0.5">
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>⚠️ Domain &amp; hosting not included</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  →{' '}
                  <button
                    onClick={onSwitchToCare}
                    className="underline hover:text-blue-500 transition-colors"
                    style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Add a Care Plan to include hosting
                  </button>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>
              <p className="text-xs text-slate-400 italic leading-relaxed mb-4">{p.description}</p>
              <div>
                <Link
                  href={`/order?package=${p.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center' as const,
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    transform: hov ? 'scale(1.02)' : 'scale(1)',
                    background: (hov || p.popular) ? '#2563eb' : '#f8fafc',
                    color: (hov || p.popular) ? 'white' : '#475569',
                    border: (hov || p.popular) ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
                  }}
                >
                  Get Started →
                </Link>
                <button
                  onClick={onSwitchToCare}
                  className="block w-full text-center mt-1.5 hover:text-blue-500 transition-colors"
                  style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Then add a Care Plan from $29/mo →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.7 }}>
          <strong>Domain &amp; hosting are not included in the build price.</strong>{' '}
          They are purchased separately (~$10–15/year for domain, ~$5–20/month for hosting).<br />
          <strong style={{ color: '#16a34a' }}>✅ Add a Monthly Care Plan and hosting is included in your monthly price.</strong>{' '}
          Only extra cost: your domain name (~$12/year).
        </div>
      </div>
    </>
  )
}

function CareTab() {
  const [hoveredCareCard, setHoveredCareCard] = useState<string | null>(null)

  return (
    <>
      <div className="w-full rounded-xl mb-7 px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #16a34a 0%, #15803d 50%, #16a34a 100%)' }}>
        <span>🏠</span>
        <span>Web hosting included in all care plans</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {carePlans.map(p => {
          const hov = hoveredCareCard === p.id
          return (
            <div
              key={p.name}
              onMouseEnter={() => setHoveredCareCard(p.id)}
              onMouseLeave={() => setHoveredCareCard(null)}
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`,
                padding: 24,
                display: 'flex',
                flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov
                  ? (p.popular
                    ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)'
                    : '0 16px 48px rgba(0,0,0,0.10)')
                  : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : 'none'),
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute',
                top: -2, left: -2, right: -2,
                height: hov ? 5 : 3,
                background: p.topGradient,
                transition: 'height 0.2s ease',
                borderRadius: '16px 16px 0 0',
                zIndex: 1,
              }} />

              {hov && (
                <div style={{
                  position: 'absolute',
                  top: 10, right: 10,
                  background: '#0f1f3d',
                  color: 'white',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  animation: 'fadeIn 0.2s ease both',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}>Click to order</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">★ Most Popular</div>
              )}

              <div style={{
                fontSize: 30,
                marginBottom: 12,
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-1">{p.name}</div>

              <div style={{
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>
                <div className="font-display text-3xl font-extrabold text-slate-800 mb-1">${p.price}</div>
              </div>
              <div className="text-xs text-slate-400 mb-5">/month</div>

              <ul className="space-y-1.5 mb-4 flex-1">
                {p.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.yes ? <Check /> : <Cross />}
                    <span className={f.yes ? 'text-slate-600' : 'text-slate-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              {p.details && p.details.length > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  {p.details.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < p.details.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: 11 }}>
                      <span style={{ color: '#64748b' }}>{d.label}</span>
                      <span style={{ fontWeight: 600, color: d.value === 'Not included' ? '#94a3b8' : '#0f1f3d' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 italic leading-relaxed mb-5">{p.description}</p>
              <Link
                href="/order/website-care"
                style={{
                  display: 'block',
                  textAlign: 'center' as const,
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  transform: hov ? 'scale(1.02)' : 'scale(1)',
                  background: (hov || p.popular) ? '#2563eb' : '#f8fafc',
                  color: (hov || p.popular) ? 'white' : '#475569',
                  border: (hov || p.popular) ? '2px solid #2563eb' : '2px solid #e2e8f0',
                  boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
                }}
              >Get Started →</Link>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.7, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
        <strong>⚠️ What&apos;s not included in Website Care Plans:</strong>
        {' '}Domain name, premium plugins, business email, advanced custom work, and extra update time are not included unless agreed separately. Content updates cover small changes only — new pages, redesigns, and advanced features are quoted separately. Minimum 6-month subscription. Hours do not roll over.
      </div>
    </>
  )
}

function ITSupportTab() {
  const [hoveredITCard, setHoveredITCard] = useState<string | null>(null)

  return (
    <>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.7 }}>
          First-level support only — passwords, software, printers, browser problems, and basic connectivity. Complex server or network issues are quoted separately.<br />
          <strong style={{ color: '#16a34a' }}>✅ Available as a standalone plan — no website needed.</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {itPlans.map(p => {
          const hov = hoveredITCard === p.id
          const btnBg = p.buttonColor
            ? (hov ? (p.buttonColor === '#2563eb' ? '#1d4ed8' : p.buttonColor) : p.buttonColor)
            : (hov || p.popular) ? '#2563eb' : '#f8fafc'
          const btnColor = (p.buttonColor || hov || p.popular) ? 'white' : '#475569'
          const btnBorder = (p.buttonColor || hov || p.popular)
            ? `2px solid ${p.buttonColor || '#2563eb'}`
            : '2px solid #e2e8f0'

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredITCard(p.id)}
              onMouseLeave={() => setHoveredITCard(null)}
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`,
                padding: 24,
                display: 'flex',
                flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov
                  ? (p.popular
                    ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)'
                    : '0 12px 36px rgba(0,0,0,0.1)')
                  : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute',
                top: -2, left: -2, right: -2,
                height: hov ? 5 : 3,
                background: p.topGradient,
                transition: 'height 0.2s ease',
                borderRadius: '16px 16px 0 0',
                zIndex: 1,
              }} />

              {hov && (
                <div style={{
                  position: 'absolute',
                  top: 10, right: 10,
                  background: '#0f1f3d',
                  color: 'white',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  animation: 'fadeIn 0.2s ease both',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}>Click to order</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">★ Most Popular</div>
              )}

              <div style={{
                fontSize: 30,
                marginBottom: 12,
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{p.name}</div>

              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#0f1f3d',
                lineHeight: 1,
                margin: '6px 0 4px',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>
                ${p.price} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>/month</span>
              </div>

              <ul className="space-y-1.5 mt-4 mb-5 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{p.description}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 3 }}>Good for</div>
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', lineHeight: 1.55 }}>{p.goodFor}</div>
              </div>

              <div>
                <a
                  href={p.href}
                  style={{
                    display: 'block',
                    textAlign: 'center' as const,
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    transform: hov ? 'scale(1.02)' : 'scale(1)',
                    background: btnBg,
                    color: btnColor,
                    border: btnBorder,
                    boxShadow: (hov && p.popular) ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
                  }}
                >
                  Get Started →
                </a>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Standalone plan — no website needed
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
  const [hoveredDesignCard, setHoveredDesignCard] = useState<string | null>(null)

  return (
    <>
      <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎨</span>
        <div style={{ fontSize: 13, color: '#7c3aed', lineHeight: 1.7 }}>
          All designs are custom branded to your business. You provide your logo and brand colors on setup. Files delivered as high-resolution images ready to post or publish.<br />
          <strong style={{ color: '#16a34a' }}>✅ Available as a standalone plan — no website needed.</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {designPlans.map(p => {
          const hov = hoveredDesignCard === p.id
          const btnBg = p.buttonColor
            ? (hov ? (p.buttonColor === '#7c3aed' ? '#6d28d9' : p.buttonColor) : p.buttonColor)
            : (hov || p.popular) ? '#2563eb' : '#f8fafc'
          const btnColor = (p.buttonColor || hov || p.popular) ? 'white' : '#475569'
          const btnBorder = (p.buttonColor || hov || p.popular)
            ? `2px solid ${p.buttonColor || '#2563eb'}`
            : '2px solid #e2e8f0'

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredDesignCard(p.id)}
              onMouseLeave={() => setHoveredDesignCard(null)}
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: 16,
                border: `2px solid ${p.popular ? '#3b82f6' : '#e2e8f0'}`,
                padding: 24,
                display: 'flex',
                flexDirection: 'column' as const,
                transform: hov ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hov
                  ? (p.popular
                    ? '0 0 0 4px rgba(37,99,235,0.15), 0 16px 48px rgba(37,99,235,0.18)'
                    : '0 12px 36px rgba(0,0,0,0.1)')
                  : (p.popular ? '0 8px 30px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute',
                top: -2, left: -2, right: -2,
                height: hov ? 5 : 3,
                background: p.topGradient,
                transition: 'height 0.2s ease',
                borderRadius: '16px 16px 0 0',
                zIndex: 1,
              }} />

              {hov && (
                <div style={{
                  position: 'absolute',
                  top: 10, right: 10,
                  background: '#0f1f3d',
                  color: 'white',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  animation: 'fadeIn 0.2s ease both',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}>Click to order</div>
              )}

              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap shadow-md">★ Most Popular</div>
              )}

              <div style={{
                fontSize: 30,
                marginBottom: 12,
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>{p.icon}</div>

              <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
              <div className="font-display font-bold text-slate-800 text-lg mb-2">{p.name}</div>

              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#0f1f3d',
                lineHeight: 1,
                margin: '6px 0 4px',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: hov ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'left center',
              }}>
                ${p.price} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>/month</span>
              </div>

              <ul className="space-y-1.5 mt-4 mb-5 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                ))}
              </ul>

              <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{p.description}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 3 }}>Good for</div>
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', lineHeight: 1.55 }}>{p.goodFor}</div>
              </div>

              <div>
                <a
                  href={p.href}
                  style={{
                    display: 'block',
                    textAlign: 'center' as const,
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    transform: hov ? 'scale(1.02)' : 'scale(1)',
                    background: btnBg,
                    color: btnColor,
                    border: btnBorder,
                    boxShadow: (hov && p.popular) ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
                  }}
                >
                  Get Started →
                </a>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Standalone plan — no website needed
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
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-3xl overflow-hidden grain" style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)' }}>
        <div className="p-10 md:p-14 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Flexible Pricing</div>
            <h3 className="font-display text-3xl font-extrabold text-white mb-2">Need a Custom Mix?</h3>
            <div className="font-display text-4xl font-extrabold text-white mb-1">From $49<span className="text-lg font-normal text-white/50">/mo</span></div>
            <p className="text-white/55 text-sm mb-6">Not every business fits a standard package.</p>
            <ul className="space-y-2">
              {['Website maintenance', 'Monthly website updates', 'Social media designs', 'Website banners', 'L1 IT support', 'Priority support', 'Custom platform maintenance', 'Mix & match any services'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-blue-400 font-bold">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-8">
            <h4 className="font-display font-extrabold text-white text-xl mb-3">We build it around you.</h4>
            <p className="text-white/55 text-sm leading-relaxed mb-7">Tell us what you need — how many pages to update, how many designs per month, what kind of support — and we&apos;ll give you an exact price. No fluff, no overpaying.</p>
            <Link href="/contact" className="block w-full text-center py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-blue-50 transition-all mb-3" style={{ color: '#0f1f3d' }}>Request Custom Plan →</Link>
            <p className="text-white/35 text-xs leading-relaxed">Tell us what your business needs and we will create a package that fits your workflow and budget.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'build',   label: 'Build a Website' },
  { id: 'care',    label: 'Website Monthly Care' },
  { id: 'it',      label: 'L1 IT Support' },
  { id: 'design',  label: 'Design & Social Media' },
  { id: 'custom',  label: 'Custom' },
]

export function PricingTabs() {
  const [active, setActive] = useState<TabId>('build')
  const [fading, setFading] = useState(false)
  const [displayed, setDisplayed] = useState<TabId>('build')

  function switchTab(tab: TabId) {
    if (tab === active || fading) return
    setFading(true)
    setTimeout(() => { setDisplayed(tab); setActive(tab); setFading(false) }, 150)
  }

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple, Honest Pricing</h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">Build your website once. Maintain it monthly. Add what you need.</p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5 flex-wrap justify-center">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{ fontSize: 12, padding: '7px 14px' }}
                className={`rounded-lg font-semibold transition-all ${active === t.id ? 'bg-white text-slate-800 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              >
                {t.label}
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
            See full pricing with all details →
          </Link>
        </div>
      </div>
    </section>
  )
}
