import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LogoMark } from '@/components/public/Logo'

const COMPANY_HREFS = ['/about', '/portfolio', '/pricing', '/review', '/contact', '/login']

export function PublicFooter() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const services = t.raw('services') as string[]
  const company = t.raw('company') as string[]

  return (
    <footer style={{ background: '#0a1628' }} className="text-white/50 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark size={32} />
              <span className="font-display font-bold text-white text-sm">AG Development</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">{t('tagline')}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('servicesHeading')}</h4>
            <div className="space-y-2.5">
              {services.map(s => (
                <Link key={s} href="/services" className="block text-sm hover:text-white/80 transition-colors">{s}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('companyHeading')}</h4>
            <div className="space-y-2.5">
              {company.map((l, i) => (
                <Link key={l} href={COMPANY_HREFS[i]} className="block text-sm hover:text-white/80 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('contactHeading')}</h4>
            <div className="space-y-3.5 text-sm">
              <div>
                <div className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{t('emailLabel')}</div>
                <a href={`mailto:${t('email')}`} className="hover:text-white/80 transition-colors break-words">{t('email')}</a>
              </div>
              {locale === 'mk' && (
                <div>
                  <div className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{t('phoneLabel')}</div>
                  <a href="tel:+38975498887" className="hover:text-white/80 transition-colors">{t('phone')}</a>
                </div>
              )}
              <div>
                <div className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{t('availabilityLabel')}</div>
                <div>{t('contactHours')}</div>
              </div>
              <div className="text-white/40 pt-0.5">{t('contactArea')}</div>
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs">
          <span>{t('rights')}</span>
          <span>{t('bottomTagline')}</span>
        </div>
      </div>
    </footer>
  )
}
