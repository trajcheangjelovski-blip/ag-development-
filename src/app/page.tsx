import Link from 'next/link'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { PricingTabs } from '@/components/public/PricingTabs'
import { ServiceCards } from '@/components/public/ServiceCards'
import { ServicesSection } from '@/components/public/ServicesSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AG Development — Websites, IT Support & Digital Growth for Small Businesses',
  description: 'Get reliable help with your website, email, domain, social media, and tech — without hiring full-time IT or a design agency.',
}

const iconProps = {
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const

const whyUs = [
  {
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'No Full-Time Hire', desc: 'Expert help without a $60K+ salary. Pay only for what you use each month.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Fixed Monthly Pricing', desc: 'Know exactly what\'s included. No surprise invoices, no hourly guessing.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'US-Based Remote Support', desc: 'Remote team that understands American small businesses. Plain English, always.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    title: 'Proof of Every Task', desc: 'Before/after screenshots and completion notes for every task we complete.',
  },
]

const steps = [
  ['Choose Plan', 'Pick the monthly support plan that fits your business size and budget.'],
  ['Get Access', 'Receive your client portal login. Submit requests and track everything.'],
  ['Submit Request', 'Describe the issue or task. Attach a screenshot if helpful.'],
  ['We Handle It', 'Remote support within your response window. No on-site visits needed.'],
  ['See Proof', 'Before/after screenshots and a completion note once the work is done.'],
]

const testimonials = [
  { text: 'AG Development fixed our email issue in less than a day. We were losing leads and they saved us.', name: 'Sarah M.', biz: 'Bloom Florist', initials: 'SM', avatar: 'linear-gradient(135deg, #2563eb, #7c3aed)' },
  { text: 'Our Shopify checkout had problems for weeks. Alex diagnosed it in hours and documented everything.', name: 'Mike T.', biz: 'Precision Auto', initials: 'MT', avatar: 'linear-gradient(135deg, #0891b2, #2563eb)' },
  { text: 'Affordable, professional, and they explain what they fixed. Finally an IT company that speaks plain English.', name: 'Jennifer L.', biz: 'Lake Tahoe Rentals', initials: 'JL', avatar: 'linear-gradient(135deg, #7c3aed, #db2777)' },
  { text: "We don't have IT staff. AG Development is essentially our outsourced IT team.", name: 'David K.', biz: 'Coastal Realty Group', initials: 'DK', avatar: 'linear-gradient(135deg, #0f1f3d, #2563eb)' },
]

function Stars() {
  return (
    <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <PublicHeader />

      {/* HERO */}
      <section
        className="relative overflow-hidden min-h-screen flex flex-col justify-center px-6 grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0a1628 30%, #0f1f3d 60%, #162b52 100%)' }}
      >
        {/* Ambient orbs */}
        <div
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full pointer-events-none animate-float-alt"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 60%)', filter: 'blur(60px)' }}
        />

        {/* Grid dots pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="max-w-6xl mx-auto relative z-10 pt-24 pb-20">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 glass rounded-full px-5 py-2 text-xs font-semibold text-white/80 mb-10 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot flex-shrink-0" />
            Trusted by Small Businesses Across the US
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-1 font-display text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white max-w-4xl mb-7">
            Websites, IT Support &<br />
            <span className="gradient-text">Digital Growth</span><br />
            for Small Businesses
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-2 text-lg lg:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed">
            Get reliable help with your website, email, domain, social media, and tech — without hiring full-time IT or a design agency.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-3 flex flex-wrap gap-4 mb-20">
            <Link
              href="/review"
              className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white"
            >
              Get Free Website Review →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
            >
              View Packages
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-4 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10">
            {[['50+', 'Happy Clients'], ['99%', 'Satisfaction'], ['48hr', 'Response Time'], ['5★', 'Average Rating']].map(([n, l]) => (
              <div key={l} className="text-center md:text-left">
                <div className="font-display text-4xl font-extrabold gradient-text mb-1">{n}</div>
                <div className="text-sm text-white/45 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-scroll-bounce">
          <span className="text-xs text-white/30 font-medium tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      <ServiceCards />

      {/* SERVICES */}
      <ServicesSection />

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Simple. Transparent. Reliable.</h2>
            <p className="text-slate-500 text-lg">From sign-up to completed task in 5 easy steps.</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[19px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-blue-500 via-blue-300 to-transparent hidden md:block" />
            <div className="space-y-0">
              {steps.map(([title, desc], i) => (
                <div key={title} className="flex gap-6 group">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-white text-sm z-10 shadow-lg shadow-blue-500/20 transition-all group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="pb-10 flex-1">
                    <h3 className="font-display font-bold text-slate-800 mb-1.5 text-lg">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PricingTabs />

      {/* WHY CHOOSE US */}
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #162b52 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Why Choose Us</div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">IT Support Built for Small Businesses</h2>
            <p className="text-white/50 text-lg max-w-lg mx-auto">No agency fluff. No enterprise overhead. Just reliable help that fits your budget.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyUs.map((w, i) => (
              <div key={w.title} className="relative glass rounded-2xl p-7 card-hover-glow cursor-default overflow-hidden">
                <div className="absolute top-5 right-6 font-display text-4xl font-extrabold text-white/[0.07] leading-none select-none">
                  0{i + 1}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-300 mb-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(124,58,237,0.18))',
                    border: '1px solid rgba(96,165,250,0.25)',
                  }}
                >
                  {w.icon}
                </div>
                <h3 className="font-display font-bold text-white mb-2">{w.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="card-hover flex flex-col bg-white border border-slate-100 rounded-2xl p-6 cursor-default shadow-sm">
                <Stars />
                <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0"
                    style={{ background: t.avatar }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.biz}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 50%, #162b52 100%)' }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Ready to Get Started?</div>
          <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-white mb-5">
            Real IT Support for<br />Real Small Businesses
          </h2>
          <p className="text-white/55 text-lg mb-10 leading-relaxed">
            Start with a free website review — no pressure, no commitment. We&apos;ll tell you exactly what we can improve.
          </p>
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
