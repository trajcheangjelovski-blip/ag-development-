// portfolio/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Real client websites and design work by AG Development — custom sites, WordPress builds, social media graphics, logos, and print materials.',
  openGraph: {
    title: 'Portfolio — AG Development',
    description: 'Real client websites and design work by AG Development.',
    url: 'https://ag-development.dev/portfolio',
  },
  alternates: { canonical: 'https://ag-development.dev/portfolio' },
}

// Live, clickable demo websites
const demos = [
  {
    slug: 'restaurant',
    name: 'Bella Cucina',
    type: 'Restaurant Website',
    desc: 'Full menu, photo gallery and table reservations for an Italian restaurant.',
    tags: ['WordPress-style', 'Menu', 'Reservations'],
    grad: 'linear-gradient(135deg, #b45309 0%, #1a1410 120%)',
  },
  {
    slug: 'dental',
    name: 'BrightSmile Dental',
    type: 'Clinic Website',
    desc: 'Service pages, team profiles and online appointment booking for a dental clinic.',
    tags: ['WordPress-style', 'Booking', 'SEO'],
    grad: 'linear-gradient(135deg, #38bdf8 0%, #0c4a6e 120%)',
  },
  {
    slug: 'fitness',
    name: 'PulseFit Studio',
    type: 'Fitness Website',
    desc: 'Class schedule, membership pricing and trainer profiles for a gym.',
    tags: ['WordPress-style', 'Pricing', 'Schedule'],
    grad: 'linear-gradient(135deg, #65a30d 0%, #0b0f0a 120%)',
  },
  {
    slug: 'store',
    name: 'Urban Threads',
    type: 'Shopify-style Store',
    desc: 'Product grid, categories, sale badges and checkout-ready layout for an online shop.',
    tags: ['Shopify', 'E-commerce', 'Product pages'],
    grad: 'linear-gradient(135deg, #57534e 0%, #1c1917 120%)',
  },
]

// Real client websites built & maintained by AG Development
const websites = [
  {
    name: 'Муровска Меана',
    nameEn: 'Murovska Meana',
    url: 'https://murovskameana.mk',
    type: 'Restaurant Website',
    location: 'Skopje, North Macedonia',
    desc: 'Traditional Macedonian restaurant with a fully custom-built website — multilingual (MK/EN), full food & drinks menu, photo gallery, table reservations, and Wolt delivery integration.',
    tags: ['Custom Build', 'Multilingual', 'Reservations', 'Wolt Integration'],
    role: 'Website build + ongoing monthly care',
    grad: 'linear-gradient(135deg, #7c1d0e 0%, #c0392b 40%, #8b4513 100%)',
    accent: '#c0392b',
    icon: '🍽️',
    year: '2023',
  },
  {
    name: 'Cross Bearers MK',
    nameEn: 'Cross Bearers MK',
    url: 'https://crossbearers.mk',
    type: 'Motorcycle Club',
    location: 'Veles, North Macedonia',
    desc: 'Motorcycle brotherhood club website with events calendar, photo gallery, blog, club history, and humanitarian activity pages — built on WordPress with Elementor.',
    tags: ['WordPress', 'Elementor', 'Events', 'Blog'],
    role: 'Website build + ongoing monthly care',
    grad: 'linear-gradient(135deg, #111111 0%, #1a1a1a 50%, #2d1f0e 100%)',
    accent: '#d97706',
    icon: '🏍️',
    year: '2024',
  },
]


export default function PortfolioPage() {
  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">My Work</div>
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">Real client websites I build &amp; maintain</h1>
          <p className="text-white/75 text-lg">These are real businesses I work with — from first launch to day-to-day care. Every site here is live, running, and under my ongoing support.</p>
        </div>
      </section>

      {/* Client Websites */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Client Websites</div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">Sites I built &amp; keep running</h2>
            <p className="text-slate-600 max-w-2xl">
              Each project below is a real client — I built their website from scratch and continue to handle hosting, updates, and support every month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {websites.map(w => (
              <div
                key={w.url}
                className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                {/* Preview banner */}
                <div
                  className="relative flex flex-col justify-end p-7"
                  style={{ background: w.grad, minHeight: 200 }}
                >
                  {/* Year badge */}
                  <span
                    className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(6px)' }}
                  >
                    Since {w.year}
                  </span>
                  <div className="text-4xl mb-3">{w.icon}</div>
                  <div className="font-display font-extrabold text-white text-2xl leading-tight">{w.name}</div>
                  <div className="text-white/65 text-sm mt-1 font-medium">{w.type} · {w.location}</div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{w.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {w.tags.map(t => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{t}</span>
                    ))}
                  </div>

                  <div
                    className="text-xs font-semibold px-3 py-2 rounded-lg mb-5"
                    style={{ background: '#f0fdf4', color: '#166534' }}
                  >
                    ✓ {w.role}
                  </div>

                  <a
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-lg text-white transition-all hover:-translate-y-0.5"
                    style={{ background: w.accent, boxShadow: `0 4px 16px ${w.accent}55` }}
                  >
                    Visit live site →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo websites */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Sites I Built</div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">Websites I built</h2>
            <p className="text-slate-600 max-w-2xl mb-3">
              These are front-end only builds — the design, layout, and UI are fully built out, but they don&apos;t include a live backend, real data, or actual business integrations. They show the kind of website I can build for your business.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fef9c3', color: '#854d0e' }}>
              ⚠️ Front-end demo only — not a live business website
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demos.map(w => (
              <Link
                key={w.slug}
                href={`/demos/${w.slug}`}
                target="_blank"
                rel="noreferrer"
                className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all group"
              >
                <div className="h-52 flex items-center justify-center relative" style={{ background: w.grad }}>
                  <div className="text-center">
                    <div className="font-display font-extrabold text-white text-2xl drop-shadow">{w.name}</div>
                    <div className="text-white/70 text-xs mt-1 uppercase tracking-widest">{w.type}</div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    View front-end demo →
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-slate-800 mb-2">{w.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{w.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {w.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{t}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center text-white" style={{ background: '#0f1f3d' }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">Want a website like these?</h2>
        <p className="text-white/70 mb-7">I&apos;ll build you a clean, modern site and handle everything from hosting to monthly updates.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/review" className="btn-primary px-7 py-3.5">See a Demo of Your Website for Your Business →</Link>
          <Link href="/contact" className="btn-outline-white px-7 py-3.5">Start Your Website Project</Link>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
