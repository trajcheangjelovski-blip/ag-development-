// about/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — AG Development | Website Design, WordPress, Shopify & IT Support',
  description: 'AG Development LLC builds modern business websites, WordPress sites and Shopify stores, and provides IT support for small businesses. A registered Wyoming company founded by Trajche Angjelovski.',
}

const WY_SEARCH = 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx'

export default function AboutPage() {
  const t = useTranslations('about')
  const services = t.raw('services') as { icon: string; title: string; sub: string; text: string }[]
  const skills = t.raw('skills') as { icon: string; title: string; items: string[] }[]
  const experience = t.raw('experience') as { role: string; period: string; note: string }[]
  const education = t.raw('education') as { school: string; detail: string }[]
  const regDetails = t.raw('regDetails') as { k: string; v: string }[]

  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{t('heroEyebrow')}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">{t('heroTitle')}</h1>
          <p className="text-white/75 text-base sm:text-lg mb-4">{t('heroP1')}</p>
          <p className="text-white/75 text-base sm:text-lg mb-4">{t('heroP2')}</p>
          <p className="text-white font-semibold mb-6">{t('heroTagline')}</p>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link href="/review" className="bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
              {t('ctaDemo')}
            </Link>
            <Link href="/contact" className="border border-white/30 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
              {t('ctaStart')}
            </Link>
          </div>
          <span className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-sm font-semibold px-3 py-1.5 rounded-full">
            ✓ {t('verifiedBadge')}
          </span>
        </div>
      </section>

      {/* What we build */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('buildEyebrow')}</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-4">{t('buildTitle')}</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-3">{t('buildP1')}</p>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-8">{t('buildP2')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(s => (
              <div key={s.title} className="card p-6">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="font-display font-bold text-slate-800 mb-1">{s.title}</h3>
                <div className="text-sm font-semibold text-blue-600 mb-2">{s.sub}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <Link href="/review" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 mt-8">
            {t('buildCta')}
          </Link>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('founderEyebrow')}</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-1">{t('founderName')}</h2>
          <p className="text-slate-500 font-medium mb-5">{t('founderRole')}</p>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>{t('founderP1')}</p>
            <p>{t('founderP2')}</p>
            <p>{t('founderP3')}</p>
            <p>{t('founderP4')}</p>
          </div>
        </div>
      </section>

      {/* Registered company */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('regEyebrow')}</div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-3">{t('regTitle')}</h2>
          <p className="text-slate-600 leading-relaxed mb-5">{t('regP1')}</p>
          <div className="card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {regDetails.map(d => (
                <div key={d.k}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{d.k}</div>
                  <div className="font-semibold text-slate-800">{d.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100">
              <a href={WY_SEARCH} target="_blank" rel="noreferrer" className="btn-secondary text-sm px-4 py-2.5">
                {t('regCta')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('skillsEyebrow')}</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-4">{t('skillsTitle')}</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-8">{t('skillsP1')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map(g => (
              <div key={g.title} className="card p-6">
                <div className="text-2xl mb-3">{g.icon}</div>
                <h3 className="font-display font-bold text-slate-800 mb-3">{g.title}</h3>
                <ul className="space-y-2">
                  {g.items.map(it => (
                    <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('expEyebrow')}</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-8">{t('expTitle')}</h2>
          <div className="space-y-4">
            {experience.map(e => (
              <div key={e.role} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="font-display font-bold text-slate-800">{e.role}</div>
                  <div className="text-sm text-slate-500">{e.note}</div>
                </div>
                {e.period && <div className="text-xs font-semibold text-blue-600 whitespace-nowrap">{e.period}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t('eduEyebrow')}</div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-6">{t('eduTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {education.map(ed => (
              <div key={ed.school} className="card p-5">
                <div className="font-display font-bold text-slate-800">{ed.school}</div>
                <div className="text-sm text-slate-500 mt-1">{ed.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{t('finalEyebrow')}</div>
          <h2 className="font-display text-3xl font-extrabold text-white mb-4">{t('finalTitle')}</h2>
          <p className="text-white/70 mb-3">{t('finalP1')}</p>
          <p className="text-white/70 mb-7">{t('finalP2')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/review" className="bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
              {t('ctaDemo')}
            </Link>
            <Link href="/contact" className="border border-white/30 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
              {t('ctaStart')}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
