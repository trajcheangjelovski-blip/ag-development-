import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { PricingAddOns } from '@/components/public/PricingAddOns'
import { AddToCartButton } from '@/components/public/Cart'
import { getPlans, effectivePrice, type Plan } from '@/lib/plans'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent monthly pricing for website care, IT support, and social media design. No hidden fees. Plans starting from $29/mo.',
  keywords: ['website maintenance pricing', 'IT support cost', 'small business tech pricing', 'monthly website plan'],
  openGraph: {
    title: 'Pricing — AG Development',
    description: 'Monthly plans for website care, IT support, and social media design. Starting at $29/mo.',
    url: 'https://ag-development.dev/pricing',
  },
  alternates: { canonical: 'https://ag-development.dev/pricing' },
}

// ── Data ──────────────────────────────────────────────────────────────────────

const buildPackages = [
  {
    id: 'starter-site',
    name: 'Starter Site', originalPrice: 200, salePrice: 150, discount: 'Save $50', icon: '📄',
    badge: 'Simple & Clean', badgeColor: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200', popular: false,
    features: ['1-page professional website', 'Mobile responsive design', 'Contact form', 'Basic SEO setup', 'Google Maps integration', 'Social media links', 'Hosting setup assistance', '1 revision round'],
    description: 'A simple one-page website for freelancers, small businesses, and local service providers who need a clean online presence.',
    delivery: '5–7 business days',
  },
  {
    id: 'business-site',
    name: 'Business Site', originalPrice: 300, salePrice: 250, discount: 'Save $50', icon: '🌐',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    border: 'border-blue-500', popular: true,
    features: ['Up to 5 pages', 'Home, About, Services, Gallery, Contact', 'Mobile responsive design', 'Contact form + Google Maps', 'Basic SEO setup', 'Speed optimization', 'Social media links', '2 revision rounds'],
    description: 'A complete small business website with the essential pages your company needs to look professional online.',
    delivery: '7–10 business days',
  },
  {
    id: 'premium-site',
    name: 'Premium Site', originalPrice: 450, salePrice: 350, discount: 'Save $100', icon: '⭐',
    badge: 'More Pages', badgeColor: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200', popular: false,
    features: ['Up to 8 pages', 'Blog or news section', 'Gallery or portfolio', 'Advanced SEO setup', 'Google Analytics setup', 'Speed optimization', 'Core Web Vitals improvement', '3 revision rounds'],
    description: 'A more advanced website for businesses that need more pages, better structure, and stronger online presentation.',
    delivery: '10–14 business days',
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store', originalPrice: 800, salePrice: 600, discount: 'Save $200', icon: '🛒',
    badge: 'Online Store', badgeColor: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300', popular: false,
    features: ['Shopify or WooCommerce setup', 'Up to 20 products added', 'Product pages + categories', 'Cart and checkout setup', 'Payment gateway connection assistance', 'Basic store design', 'Mobile responsive layout', '2 revision rounds'],
    description: 'A complete online store setup for businesses that want to sell products online.',
    delivery: '14–21 business days',
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
    description: 'Simple website maintenance for businesses that want their site to stay online, secure, and updated.',
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
  },
  {
    id: 'content-care',
    name: 'Content Care', price: 49, icon: '✏️',
    badge: 'Most Popular', badgeColor: 'bg-blue-600 text-white',
    border: 'border-blue-500', popular: true,
    description: 'Website care plus small monthly content updates for businesses that need occasional changes.',
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
  },
  {
    id: 'growth-care',
    name: 'Growth Care', price: 100, icon: '🎨',
    badge: 'Updates + Design', badgeColor: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200', popular: false,
    description: 'More monthly website support for businesses that update their website regularly.',
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
  },
  {
    id: 'full-care',
    name: 'Full Care', price: 150, icon: '🚀',
    badge: 'Maximum Support', badgeColor: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300', popular: false,
    description: 'Our most complete website care plan for active business websites.',
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
  },
]

const extraServices = [
  ['Domain Registration & Setup', '$15–$20/yr', 'One-time setup'],
  ['Business Email Setup (Google / M365)', '$50', 'One-time setup'],
  ['Speed Optimization Audit', '$79', 'One-time'],
  ['SEO On-Page Optimization (per page)', '$39', 'Per page'],
  ['Google Analytics Setup + Events', '$59', 'One-time'],
  ['Landing Page (ads / promo / event)', '$299–$499', 'One-time'],
  ['Additional Website Page', '$79–$149', 'Per page'],
  ['New Section Added to Existing Page', '$49–$99', 'Per section'],
  ['SSL Setup / Renewal Help', '$29', 'One-time'],
  ['Website Migration', '$99–$199', 'One-time'],
  ['WordPress to Shopify Transfer', '$299', 'One-time'],
]

const notIncluded = [
  'Domain and hosting fees',
  'Premium plugins, themes, or stock photo licenses',
  'New full pages outside the initial build (quoted separately)',
  'Complete redesigns (new project)',
  'E-commerce product entry beyond 20 items',
  'Paid ad management (Google Ads, Meta Ads)',
  'SEO content writing',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Check() { return <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> }
function Cross() { return <span className="text-slate-300 flex-shrink-0">✗</span> }

export default async function PricingPage() {
  // Live prices from the admin-managed plans table (static fallback)
  const { plans } = await getPlans()
  const planById = new Map<string, Plan>(plans.map(p => [p.id, p]))
  const live = (id: string) => planById.get(id)

  return (
    <>
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white py-20 px-6 grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 60%, #162b52 100%)' }}
      >
        <div
          className="absolute -top-20 right-0 w-[500px] h-[400px] pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 animate-fade-up">How Pricing Works</div>
          <h1 className="font-display text-5xl lg:text-6xl font-extrabold text-white mb-5 animate-fade-up-1 leading-tight">
            Simple, Honest <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto animate-fade-up-2">
            Build your website once. Maintain it monthly.<br className="hidden md:block" />Add exactly what your business needs — nothing more.
          </p>
          <div className="flex justify-center flex-wrap gap-4 mt-9 animate-fade-up-3">
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">Step 1</span> Pick a website build
            </div>
            <div className="text-white/30 self-center hidden sm:block">→</div>
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">Step 2</span> Pick a monthly care plan
            </div>
            <div className="text-white/30 self-center hidden sm:block">→</div>
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">Optional</span> Add IT / Social / Design
            </div>
          </div>
        </div>
      </section>

      {/* ── STEP 1: WEBSITE BUILDS ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Limited Time Offer banner */}
          <div className="rounded-xl mb-10 px-6 py-3.5 flex items-center justify-center gap-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)' }}>
            <span className="text-yellow-300">🎉</span>
            <span>Limited Time Offer — All website builds are currently discounted. Lock in your price today.</span>
            <span className="text-yellow-300">🎉</span>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Step 1 — One Time</div>
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-800 mb-3">Build Your Website</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Choose the package that fits your business. Pay once. Own it forever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {buildPackages.map(p0 => {
              const lp = live(p0.id)
              const p = {
                ...p0,
                badge: lp?.badge || p0.badge,
                features: lp?.features || p0.features,
                description: (lp?.description || p0.description) as string,
                delivery: lp?.delivery || p0.delivery,
              }
              const regular = lp?.price ?? p0.originalPrice
              const charged = lp ? effectivePrice(lp) : p0.salePrice
              const onSale = charged < regular
              return (
              <div key={p.name} className={`relative bg-white rounded-2xl border-2 ${p.border} p-6 flex flex-col card-hover-glow ${p.popular ? 'shadow-xl shadow-blue-500/15' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">★ Most Popular</div>
                )}
                {/* Discount badge top-right */}
                {onSale && (
                  <div className="absolute top-4 right-4">
                    <span className="discount-badge">Save ${regular - charged}</span>
                  </div>
                )}
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
                <div className="font-display font-bold text-slate-800 text-xl mb-2">{lp?.name || p.name}</div>
                {/* Strikethrough original + sale price */}
                {onSale && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>${regular}</span>}
                <div className="sale-price">${charged} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>one-time</span></div>
                <div className="mb-5" />
                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{p.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
                  <span>⏱</span><span>Delivery: {p.delivery}</span>
                </div>
                <Link href={`/order?package=${p.id}`} className={`block text-center py-3 rounded-xl font-bold text-sm transition-all mb-2 ${p.popular ? 'bg-blue-600 text-white hover:bg-blue-500 btn-glow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>
                  Get Started →
                </Link>
                <AddToCartButton id={p.id} />
              </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-slate-400 max-w-3xl mx-auto">
            💡 Domain and hosting are not included in the one-time website build price. You can add a monthly Website Care Plan to include hosting, maintenance, backups, updates, and support. Client must provide logo, text, and images. Delivery starts after content is received.
          </p>
        </div>
      </section>

      {/* ── CONNECTING BANNER ────────────────────────────────────────────────── */}
      <div className="bg-blue-600 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold">✓</div>
            <div>
              <div className="text-white font-bold">Step 1 done — your website is built.</div>
              <div className="text-white/70 text-sm">Now protect it, keep it updated, and grow it.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80 font-bold text-sm">
            <span>Next:</span>
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-white">Pick a Monthly Care Plan →</div>
          </div>
        </div>
      </div>

      {/* ── STEP 2: CARE PLANS ───────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f0f7ff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">Step 2 — Hosting Included</div>
            <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-800">Choose Your Care Plan</h2>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-full border border-emerald-200">🏠 Hosting Included</span>
            </div>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Keep your site secure, up-to-date, and maintained — automatically every month. <strong className="text-slate-600">Web hosting is included in every care plan.</strong></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {carePlans.map(p0 => {
              const lp = live(p0.id)
              const p = {
                ...p0,
                badge: lp?.badge || p0.badge,
                features: lp?.features
                  ? lp.features.map(f => ({ text: f, yes: true }))
                  : p0.features,
                description: (lp?.description || p0.description) as string,
                details: (lp?.details || p0.details) as DetailRow[],
              }
              const regular = lp?.price ?? p0.price
              const charged = lp ? effectivePrice(lp) : p0.price
              const onSale = charged < regular
              return (
              <div key={p.name} className={`relative bg-white rounded-2xl border-2 ${p.border} p-6 flex flex-col card-hover-glow ${p.popular ? 'shadow-xl shadow-blue-500/15' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">★ Most Popular</div>
                )}
                {onSale && (
                  <div className="absolute top-4 right-4">
                    <span className="discount-badge">Save ${regular - charged}/mo</span>
                  </div>
                )}
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{p.badge}</div>
                <div className="font-display font-bold text-slate-800 text-xl mb-1">{p.name}</div>
                {onSale && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>${regular}/mo</span>}
                <div className="font-display text-4xl font-extrabold text-slate-800 mb-1">${charged}</div>
                <div className="text-xs text-slate-400 mb-5">/month</div>
                <ul className="space-y-2 mb-4 flex-1">
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
                <Link href="/order" className={`block text-center py-3 rounded-xl font-bold text-sm transition-all mb-2 ${p.popular ? 'bg-blue-600 text-white hover:bg-blue-500 btn-glow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>
                  Choose Plan →
                </Link>
                <AddToCartButton id={p.id} />
              </div>
              )
            })}
          </div>

          <div style={{ marginTop: 20, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.7, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
            <strong>⚠️ What&apos;s not included in Website Care Plans:</strong>
            {' '}Domain name, premium plugins, business email, advanced custom work, and extra update time are not included unless agreed separately. Content updates cover small changes only — new pages, redesigns, and advanced features are quoted separately. Minimum 6-month subscription. Hours do not roll over.
          </div>
        </div>
      </section>

      {/* ── ADD-ONS: L1 IT SUPPORT + SOCIAL MEDIA & DESIGN ───────────────────── */}
      <PricingAddOns />

      {/* ── CUSTOM PACKAGE ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl overflow-hidden grain"
            style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)' }}
          >
            <div className="p-10 md:p-14 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Flexible Pricing</div>
                <h2 className="font-display text-3xl font-extrabold text-white mb-2">Need a Custom Mix?</h2>
                <div className="font-display text-4xl font-extrabold text-white mb-2">From $49<span className="text-lg font-normal text-white/50">/mo</span></div>
                <p className="text-white/55 text-sm mb-7">Not every business fits a standard package. We build the plan around exactly what you need.</p>
                <ul className="space-y-2.5">
                  {[
                    'Website maintenance',
                    'Monthly content updates',
                    'Social media designs',
                    'Website banners',
                    'L1 IT support',
                    'Priority support',
                    'Custom platform maintenance',
                    'Mix & match any services',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-blue-400 font-bold">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-8">
                <h3 className="font-display font-extrabold text-white text-xl mb-3">We build it around you.</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-7">
                  Tell us what you need — how many pages to update, how many designs per month, what kind of support — and we&apos;ll give you an exact price. No fluff, no overpaying.
                </p>
                <Link href="/order?package=custom" className="block w-full text-center py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-blue-50 transition-all mb-3" style={{ color: '#0f1f3d' }}>
                  Request Custom Plan →
                </Link>
                <p className="text-white/35 text-xs leading-relaxed">
                  Tell us what your business needs and we will create a package that fits your workflow and budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXTRA SERVICES TABLE ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-label">À La Carte</div>
            <h2 className="font-display text-3xl font-extrabold text-slate-800 mb-3">Extra Services</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Need something specific? These are billed once as standalone items.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div>Service</div>
              <div className="text-center">Price</div>
              <div className="text-right">Billing</div>
            </div>
            {extraServices.map(([service, price, billing], i) => (
              <div key={service} className={`grid grid-cols-3 px-5 py-4 text-sm items-center ${i < extraServices.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="text-slate-700 font-medium">{service}</div>
                <div className="text-center font-semibold text-slate-800">{price}</div>
                <div className="text-right text-xs text-slate-400">{billing}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Prices are starting rates. Complex requirements may be quoted higher. All quotes confirmed before work begins.</p>
        </div>
      </section>

      {/* ── NOT INCLUDED / RULES ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-display font-bold text-amber-800 text-lg">What&apos;s NOT Included</h3>
              </div>
              <ul className="space-y-2.5">
                {notIncluded.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0 font-bold">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📋</span>
                <h3 className="font-display font-bold text-slate-800 text-lg">How It Works</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'All builds start after logo, content, and images are received from the client.',
                  'Delivery times are business days and begin after content handoff.',
                  'Revision rounds are for the same page/section — not new features.',
                  'Care plan hours expire monthly. Unused time does not carry over.',
                  'Monthly plans require a minimum 6-month commitment.',
                  'Extra hours billed at $10/hr for care plan clients.',
                  'Quotes are valid for 30 days.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-blue-500 mt-0.5 flex-shrink-0 font-bold">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-label">FAQ</div>
            <h2 className="font-display text-3xl font-extrabold text-slate-800">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {/* Q1 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                Is domain and hosting included?
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 space-y-3">
                <p>The website <strong>build price does not include domain or hosting</strong> — these are paid separately.</p>
                <p>However, if you add a Monthly Care Plan, <strong>web hosting is included</strong> in your monthly price. You will only need to pay separately for your domain name (typically $10–15/year).</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 mt-2">
                  <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">Summary</div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-slate-400 mt-0.5">→</span><span><strong>Build only</strong> — you pay for hosting separately (~$5–20/month)</span></div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong>Build + Care Plan</strong> — hosting included in your monthly fee</span></div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-slate-400 mt-0.5">→</span><span><strong>Domain name</strong> — always purchased separately (~$10–15/year)</span></div>
                </div>
              </div>
            </div>

            {/* Q2 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                Can I cancel the care plan anytime?
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                Care plans require a minimum 6-month commitment. After the initial period you can cancel anytime with 30 days notice. There are no long-term contracts beyond that.
              </div>
            </div>

            {/* Q3 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                Do I need to provide content for my website?
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                Yes — you need to provide your logo, text (business description, services, contact details), and any photos. Build delivery begins after we receive your content. We can guide you on what to prepare.
              </div>
            </div>

            {/* Q4 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                What if I need changes outside my care plan hours?
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                Extra work beyond your monthly hours is billed at $10/hr. New pages, full redesigns, or new features are quoted as separate projects. We always confirm costs before starting any extra work.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 text-center relative overflow-hidden grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 60%, #162b52 100%)' }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/55 text-lg mb-9">Start with a free website review. We&apos;ll recommend the right package for your business.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/review" className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white">
              Get Free Website Review →
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
