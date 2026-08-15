import { Link } from '@/i18n/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { PricingTabs } from '@/components/public/PricingTabs'
import { ServiceCards } from '@/components/public/ServiceCards'
import { ServicesSection } from '@/components/public/ServicesSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Websites, IT Support & Digital Growth for Small Businesses',
  description: 'AG Development helps small businesses with websites, remote IT support, email setup, social media design, and digital growth — no full-time hire needed.',
  keywords: ['website development small business', 'remote IT support', 'small business website', 'WordPress support', 'Shopify help', 'email setup', 'social media design'],
  openGraph: {
    title: 'AG Development — Websites, IT Support & Digital Growth for Small Businesses',
    description: 'Reliable tech help for small businesses. Websites, IT, email, design — all remote, all transparent.',
    url: 'https://ag-development.dev',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AG Development Homepage' }],
  },
  alternates: { canonical: 'https://ag-development.dev' },
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const whyText = t.raw('why') as { title: string; desc: string }[]
  const stepsText = t.raw('steps') as { title: string; desc: string }[]
  const testimonialsText = t.raw('testimonials') as string[]
  return (
    <>
      <PublicHeader />

      {/* HERO */}
      <section
        className="relative overflow-hidden min-h-screen flex flex-col justify-center px-6 grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0a1628 30%, #0f1f3d 60%, #162b52 100%)' }}
      >
        {/* ── Strong glowing orbs ── */}
        <div
          className="absolute -top-40 -right-40 w-[900px] h-[900px] rounded-full pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.55) 0%, rgba(37,99,235,0.15) 40%, transparent 70%)', filter: 'blur(50px)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[700px] h-[700px] rounded-full pointer-events-none animate-float-alt"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.50) 0%, rgba(124,58,237,0.15) 40%, transparent 70%)', filter: 'blur(55px)' }}
        />
        <div
          className="absolute -top-10 -left-10 w-[550px] h-[550px] rounded-full pointer-events-none animate-float-slow"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.40) 0%, transparent 65%)', filter: 'blur(60px)', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-orb-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, transparent 65%)', filter: 'blur(50px)', animationDelay: '1s' }}
        />
        {/* Center deep glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] pointer-events-none animate-orb-pulse"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 60%)', filter: 'blur(80px)', animationDelay: '3s' }}
        />

        {/* ── Aurora drift band ── */}
        <div
          className="absolute pointer-events-none animate-aurora-drift"
          style={{
            top: '25%', left: '-15%', width: '130%', height: '260px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.14) 35%, rgba(124,58,237,0.16) 65%, transparent 100%)',
            filter: 'blur(35px)',
          }}
        />

        {/* ── Sweeping light beam ── */}
        <div
          className="absolute inset-y-0 pointer-events-none animate-sweep"
          style={{
            left: 0, width: 180,
            background: 'linear-gradient(90deg, transparent 0%, rgba(147,197,253,0.12) 50%, transparent 100%)',
          }}
        />
        {/* second beam with delay */}
        <div
          className="absolute inset-y-0 pointer-events-none animate-sweep"
          style={{
            left: 0, width: 120, animationDelay: '4.5s',
            background: 'linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.10) 50%, transparent 100%)',
          }}
        />

        {/* ── Orbit ring (static) ── */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: '45%', left: '60%',
            width: 520, height: 520,
            marginLeft: -260, marginTop: -260,
            border: '1px solid rgba(96,165,250,0.22)',
            boxShadow: 'inset 0 0 40px rgba(96,165,250,0.04)',
          }}
        />
        {/* Outer faint ring */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: '45%', left: '60%',
            width: 680, height: 680,
            marginLeft: -340, marginTop: -340,
            border: '1px solid rgba(167,139,250,0.12)',
          }}
        />

        {/* ── Blue planet orbiting inner ring ── */}
        <div
          className="absolute pointer-events-none animate-orbit-planet"
          style={{
            top: '45%', left: '60%',
            width: 20, height: 20,
            marginLeft: -10, marginTop: -10,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #93c5fd, #2563eb 55%, #1e3a8a)',
            boxShadow: '0 0 14px 5px rgba(96,165,250,0.55), 0 0 30px rgba(37,99,235,0.35)',
          }}
        />

        {/* ── Purple moon orbiting outer ring ── */}
        <div
          className="absolute pointer-events-none animate-orbit-moon"
          style={{
            top: '45%', left: '60%',
            width: 12, height: 12,
            marginLeft: -6, marginTop: -6,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #c4b5fd, #7c3aed 55%, #4c1d95)',
            boxShadow: '0 0 10px 4px rgba(167,139,250,0.55), 0 0 22px rgba(124,58,237,0.35)',
          }}
        />

        {/* ── Twinkling star particles ── */}
        {[
          { top: '12%', left: '6%',  delay: 0,   dur: 2.6, size: 5, blue: true },
          { top: '22%', left: '18%', delay: 1.1, dur: 3.2, size: 3, blue: false },
          { top: '55%', left: '9%',  delay: 0.5, dur: 2.9, size: 6, blue: true },
          { top: '70%', left: '22%', delay: 2.0, dur: 3.5, size: 4, blue: false },
          { top: '18%', left: '70%', delay: 0.8, dur: 2.7, size: 5, blue: true },
          { top: '32%', left: '82%', delay: 1.6, dur: 3.1, size: 4, blue: false },
          { top: '60%', left: '75%', delay: 0.3, dur: 2.4, size: 6, blue: true },
          { top: '78%', left: '60%', delay: 2.3, dur: 3.8, size: 4, blue: false },
          { top: '40%', left: '40%', delay: 1.3, dur: 3.0, size: 3, blue: true },
          { top: '85%', left: '40%', delay: 0.9, dur: 2.8, size: 5, blue: false },
          { top: '48%', left: '55%', delay: 1.7, dur: 3.3, size: 4, blue: true },
          { top: '8%',  left: '45%', delay: 2.5, dur: 2.5, size: 3, blue: false },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none animate-twinkle"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              background: p.blue ? 'rgba(147,197,253,1)' : 'rgba(196,181,253,1)',
              boxShadow: p.blue
                ? `0 0 ${p.size * 3}px ${p.size}px rgba(96,165,250,0.7)`
                : `0 0 ${p.size * 3}px ${p.size}px rgba(167,139,250,0.65)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}

        {/* Grid dots pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="max-w-6xl mx-auto relative z-10 pt-24 pb-20">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 glass rounded-full px-5 py-2 text-xs font-semibold text-white/80 mb-10 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot flex-shrink-0" />
            {t('badge')}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-1 font-display text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white max-w-4xl mb-7">
            {t('headlineLine1')}<br />
            <span className="gradient-text">{t('headlineHighlight')}</span><br />
            {t('headlineLine2')}
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-2 text-lg lg:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed">
            {t('subheading')}
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-3 flex flex-wrap gap-4 mb-20">
            <Link
              href="/review"
              className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white"
            >
              {t('ctaDemo')}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
            >
              {t('ctaPackages')}
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-4 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10">
            {[['6+', 'clients'], ['99%', 'satisfaction'], ['3hr', 'response'], ['5★', 'rating']].map(([n, k]) => (
              <div key={k} className="text-center md:text-left">
                <div className="font-display text-4xl font-extrabold gradient-text mb-1">{n}</div>
                <div className="text-sm text-white/45 font-medium">{t(`stats.${k}`)}</div>
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
            <div className="section-label">{t('howLabel')}</div>
            <h2 className="section-title">{t('howTitle')}</h2>
            <p className="text-slate-500 text-lg">{t('howSubtitle')}</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[19px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-blue-500 via-blue-300 to-transparent hidden md:block" />
            <div className="space-y-0">
              {stepsText.map((s, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-white text-sm z-10 shadow-lg shadow-blue-500/20 transition-all group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="pb-10 flex-1">
                    <h3 className="font-display font-bold text-slate-800 mb-1.5 text-lg">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
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
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{t('whyChooseLabel')}</div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">{t('whyChooseTitle')}</h2>
            <p className="text-white/50 text-lg max-w-lg mx-auto">{t('whyChooseSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyUs.map((w, i) => (
              <div key={i} className="relative glass rounded-2xl p-7 card-hover-glow cursor-default overflow-hidden">
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
                <h3 className="font-display font-bold text-white mb-2">{whyText[i].title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{whyText[i].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label">{t('testimonialsLabel')}</div>
            <h2 className="section-title">{t('testimonialsTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((tm, i) => (
              <div key={i} className="card-hover flex flex-col bg-white border border-slate-100 rounded-2xl p-6 cursor-default shadow-sm">
                <Stars />
                <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">&ldquo;{testimonialsText[i]}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0"
                    style={{ background: tm.avatar }}
                  >
                    {tm.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{tm.name}</div>
                    <div className="text-xs text-slate-400">{tm.biz}</div>
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
          <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">{t('ctaLabel')}</div>
          <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-white mb-5">
            {t('ctaTitle1')}<br />{t('ctaTitle2')}
          </h2>
          <p className="text-white/55 text-lg mb-10 leading-relaxed">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/review" className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white">
              {t('ctaDemo')}
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
              {t('ctaAsk')}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
