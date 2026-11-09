// portfolio/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Link } from '@/i18n/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'portfolioPage.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/portfolio',
    },
    alternates: { canonical: 'https://ag-development.dev/portfolio' },
  }
}

// Live, clickable demo websites — visual/structural metadata only; copy comes from the catalog.
const demoMeta = [
  { key: 'restaurant', name: 'Bella Cucina',      slug: 'restaurant', grad: 'linear-gradient(135deg, #b45309 0%, #1a1410 120%)' },
  { key: 'dental',     name: 'BrightSmile Dental', slug: 'dental',     grad: 'linear-gradient(135deg, #38bdf8 0%, #0c4a6e 120%)' },
  { key: 'fitness',    name: 'PulseFit Studio',    slug: 'fitness',    grad: 'linear-gradient(135deg, #65a30d 0%, #0b0f0a 120%)' },
  { key: 'store',      name: 'Urban Threads',      slug: 'store',      grad: 'linear-gradient(135deg, #57534e 0%, #1c1917 120%)' },
]

// Interactive pitch demos served as static sites at /demos/<slug>/ (see demos/ in git).
const featuredMeta = [
  { key: 'aurelle',   name: 'Aurelle Lighting', slug: 'aurelle', image: '/portfolio/aurelle.jpg', accent: '#8b6a44' },
  { key: 'crumbclub', name: 'Crumb Club', slug: 'crumbclub', image: '/portfolio/crumbclub.jpg', accent: '#E0532F' },
  { key: 'veloce',    name: 'VELOCE Motor Cars', slug: 'veloce', image: '/portfolio/veloce.jpg', accent: '#111111' },
]

// Real client websites built & maintained by AG Development — structural metadata only.
const websiteMeta = [
  { key: 'murovska',     name: 'Муровска Меана',    url: 'https://murovskameana.mk',    grad: 'linear-gradient(135deg, #7c1d0e 0%, #c0392b 40%, #8b4513 100%)', accent: '#c0392b', icon: '🍽️', year: '2023' },
]

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portfolioPage')

  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{t('hero.eyebrow')}</div>
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">{t('hero.title')}</h1>
          <p className="text-white/75 text-lg whitespace-pre-line">{t('hero.desc')}</p>
        </div>
      </section>

      {/* Client Websites */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('clients.eyebrow')}</div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">{t('clients.title')}</h2>
            <p className="text-slate-600 max-w-2xl">
              {t('clients.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {websiteMeta.map(w => {
              const tags = t.raw(`websites.${w.key}.tags`) as string[]
              return (
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
                    {t('clients.sinceLabel')} {w.year}
                  </span>
                  <div className="text-4xl mb-3">{w.icon}</div>
                  <div className="font-display font-extrabold text-white text-2xl leading-tight">{w.name}</div>
                  <div className="text-white/65 text-sm mt-1 font-medium">{t(`websites.${w.key}.type`)} · {t(`websites.${w.key}.location`)}</div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{t(`websites.${w.key}.desc`)}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tags.map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>

                  <div
                    className="text-xs font-semibold px-3 py-2 rounded-lg mb-5"
                    style={{ background: '#f0fdf4', color: '#166534' }}
                  >
                    ✓ {t(`websites.${w.key}.role`)}
                  </div>

                  <a
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-lg text-white transition-all hover:-translate-y-0.5"
                    style={{ background: w.accent, boxShadow: `0 4px 16px ${w.accent}55` }}
                  >
                    {t('clients.visitCta')}
                  </a>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Live demo websites */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('demosSection.eyebrow')}</div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">{t('demosSection.title')}</h2>
            <p className="text-slate-600 max-w-2xl mb-3 whitespace-pre-line">
              {t('demosSection.desc')}
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fef9c3', color: '#854d0e' }}>
              {t('demosSection.warning')}
            </div>
          </div>

          <h3 className="font-display text-lg font-extrabold text-slate-800 mb-4">{t('demosSection.featuredTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredMeta.map(w => {
              const tags = t.raw(`demos.${w.key}.tags`) as string[]
              return (
                <a
                  key={w.slug}
                  href={`/demos/${w.slug}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all group flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.image} alt={`${w.name} — ${t(`demos.${w.key}.type`)}`} loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
                    <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white" style={{ background: w.accent }}>
                      {t('demosSection.featuredBadge')}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{t(`demos.${w.key}.type`)}</div>
                    <h3 className="font-display font-bold text-slate-800 text-xl mb-2">{w.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">{t(`demos.${w.key}.desc`)}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tags.map(tag => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>)}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">{t('demosSection.open')}</span>
                  </div>
                </a>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoMeta.map(w => {
              const tags = t.raw(`demos.${w.key}.tags`) as string[]
              return (
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
                    <div className="text-white/70 text-xs mt-1 uppercase tracking-widest">{t(`demos.${w.key}.type`)}</div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('demosSection.hover')}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-slate-800 mb-2">{w.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{t(`demos.${w.key}.desc`)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>)}
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center text-white" style={{ background: '#0f1f3d' }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">{t('cta.title')}</h2>
        <p className="text-white/70 mb-7">{t('cta.desc')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/review" className="btn-primary px-7 py-3.5">{t('cta.primary')}</Link>
          <Link href="/contact" className="btn-outline-white px-7 py-3.5">{t('cta.secondary')}</Link>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
