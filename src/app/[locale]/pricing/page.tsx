import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { PricingAddOns } from '@/components/public/PricingAddOns'
import { AddToCartButton } from '@/components/public/Cart'
import { getPlans, effectivePrice, type Plan } from '@/lib/plans'
import { regionFromLocale } from '@/i18n/routing'
import { formatPrice } from '@/lib/money'
import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent monthly pricing for website care, IT support, and social media design. No hidden fees.',
  keywords: ['website maintenance pricing', 'IT support cost', 'small business tech pricing', 'monthly website plan'],
  openGraph: {
    title: 'Pricing — AG Development',
    description: 'Monthly plans for website care, IT support, and social media design.',
    url: 'https://ag-development.dev/pricing',
  },
  alternates: { canonical: 'https://ag-development.dev/pricing' },
}

// ── Visual/numeric metadata only — all copy comes from the message catalog ─────

const buildMeta = [
  { id: 'starter-site',    originalPrice: 200, salePrice: 150, icon: '📄', badgeColor: 'bg-slate-100 text-slate-600',   border: 'border-slate-200',   popular: false },
  { id: 'business-site',   originalPrice: 300, salePrice: 250, icon: '🌐', badgeColor: 'bg-blue-600 text-white',         border: 'border-blue-500',    popular: true  },
  { id: 'premium-site',    originalPrice: 450, salePrice: 350, icon: '⭐', badgeColor: 'bg-violet-100 text-violet-700',  border: 'border-violet-200',  popular: false },
  { id: 'ecommerce-store', originalPrice: 800, salePrice: 600, icon: '🛒', badgeColor: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300', popular: false },
]

const careMeta = [
  { id: 'basic-care',   price: 29,  icon: '🛡️', badgeColor: 'bg-slate-100 text-slate-600',    border: 'border-slate-200',   popular: false },
  { id: 'content-care', price: 49,  icon: '✏️', badgeColor: 'bg-blue-600 text-white',          border: 'border-blue-500',    popular: true  },
  { id: 'growth-care',  price: 100, icon: '🎨', badgeColor: 'bg-violet-100 text-violet-700',   border: 'border-violet-200',  popular: false },
  { id: 'full-care',    price: 150, icon: '🚀', badgeColor: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300', popular: false },
]

type DetailRow = { label: string; value: string }
type ExtraRow = { service: string; price: string; billing: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function Check() { return <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> }

export default async function PricingPage() {
  const locale = await getLocale()
  const isMk = locale === 'mk'
  const region = regionFromLocale(locale)
  const t = await getTranslations('pricingPage')
  const tp = await getTranslations('pricing')
  const money = (n: number) => formatPrice(n, isMk ? 'MKD' : 'USD', locale)

  // Live, region-aware prices from the admin-managed plans table (static fallback).
  const { plans } = await getPlans(region)
  const planById = new Map<string, Plan>(plans.map(p => [p.id, p]))
  const live = (id: string) => planById.get(id)

  const notIncludedValue = t('care.notIncludedValue')

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
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 animate-fade-up">{t('hero.eyebrow')}</div>
          <h1 className="font-display text-5xl lg:text-6xl font-extrabold text-white mb-5 animate-fade-up-1 leading-tight">
            {t('hero.titleLead')} <span className="gradient-text">{t('hero.titleAccent')}</span>
          </h1>
          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto animate-fade-up-2">
            {t('hero.subtitle')}
          </p>
          <div className="flex justify-center flex-wrap gap-4 mt-9 animate-fade-up-3">
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">{t('hero.step1Label')}</span> {t('hero.step1')}
            </div>
            <div className="text-white/30 self-center hidden sm:block">→</div>
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">{t('hero.step2Label')}</span> {t('hero.step2')}
            </div>
            <div className="text-white/30 self-center hidden sm:block">→</div>
            <div className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80">
              <span className="text-blue-400 font-bold mr-2">{t('hero.optionalLabel')}</span> {t('hero.optional')}
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
            <span>{t('build.banner')}</span>
            <span className="text-yellow-300">🎉</span>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">{t('build.stepBadge')}</div>
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-800 mb-3">{t('build.title')}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t('build.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {buildMeta.map(p => {
              const lp = live(p.id)
              const name = tp(`build.${p.id}.name`)
              const badge = tp(`build.${p.id}.badge`)
              const description = tp(`build.${p.id}.description`)
              const features = tp.raw(`build.${p.id}.features`) as string[]
              const delivery = t(`build.delivery.${p.id}`)
              const regular = lp?.price ?? p.originalPrice
              const charged = lp ? effectivePrice(lp) : p.salePrice
              const onSale = charged < regular
              return (
              <div key={p.id} className={`relative bg-white rounded-2xl border-2 ${p.border} p-6 flex flex-col card-hover-glow ${p.popular ? 'shadow-xl shadow-blue-500/15' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">{tp('mostPopular')}</div>
                )}
                {onSale && (
                  <div className="absolute top-4 right-4">
                    <span className="discount-badge">{tp('save', { amount: money(regular - charged) })}</span>
                  </div>
                )}
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{badge}</div>
                <div className="font-display font-bold text-slate-800 text-xl mb-2">{name}</div>
                {onSale && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>{money(regular)}</span>}
                <div className="sale-price">{money(charged)} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>{t('build.oneTime')}</span></div>
                <div className="mb-5" />
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check />{f}</li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 italic leading-relaxed mb-3">{description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
                  <span>⏱</span><span>{t('build.deliveryLabel')}: {delivery}</span>
                </div>
                <Link href={`/order?package=${p.id}`} className={`block text-center py-3 rounded-xl font-bold text-sm transition-all mb-2 ${p.popular ? 'bg-blue-600 text-white hover:bg-blue-500 btn-glow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>
                  {t('build.getStarted')}
                </Link>
                <AddToCartButton id={p.id} />
              </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-slate-400 max-w-3xl mx-auto">
            {t('build.footnote')}
          </p>
        </div>
      </section>

      {/* ── CONNECTING BANNER ────────────────────────────────────────────────── */}
      <div className="bg-blue-600 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold">✓</div>
            <div>
              <div className="text-white font-bold">{t('connect.title')}</div>
              <div className="text-white/70 text-sm">{t('connect.text')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80 font-bold text-sm">
            <span>{t('connect.nextLabel')}:</span>
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-white">{t('connect.nextPill')}</div>
          </div>
        </div>
      </div>

      {/* ── STEP 2: CARE PLANS ───────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f0f7ff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">{t('care.stepBadge')}</div>
            <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-800">{t('care.title')}</h2>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-full border border-emerald-200">{t('care.hostingPill')}</span>
            </div>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t('care.subtitle')} <strong className="text-slate-600">{t('care.subtitleStrong')}</strong></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            {careMeta.map(p => {
              const lp = live(p.id)
              const name = tp(`care.${p.id}.name`)
              const badge = tp(`care.${p.id}.badge`)
              const description = tp(`care.${p.id}.description`)
              const features = tp.raw(`care.${p.id}.features`) as string[]
              const details = tp.raw(`care.${p.id}.details`) as DetailRow[]
              const regular = lp?.price ?? p.price
              const charged = lp ? effectivePrice(lp) : p.price
              const onSale = charged < regular
              return (
              <div key={p.id} className={`relative bg-white rounded-2xl border-2 ${p.border} p-6 flex flex-col card-hover-glow ${p.popular ? 'shadow-xl shadow-blue-500/15' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">{tp('mostPopular')}</div>
                )}
                {onSale && (
                  <div className="absolute top-4 right-4">
                    <span className="discount-badge">{tp('save', { amount: money(regular - charged) })}{t('care.saveSuffix')}</span>
                  </div>
                )}
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit ${p.badgeColor}`}>{badge}</div>
                <div className="font-display font-bold text-slate-800 text-xl mb-1">{name}</div>
                {onSale && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px' }}>{money(regular)}{t('care.saveSuffix')}</span>}
                <div className="font-display text-4xl font-extrabold text-slate-800 mb-1">{money(charged)}</div>
                <div className="text-xs text-slate-400 mb-5">{t('care.perMonth')}</div>
                <ul className="space-y-2 mb-4 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check /><span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                {details && details.length > 0 && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    {details.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < details.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>{d.label}</span>
                        <span style={{ fontWeight: 600, color: d.value === notIncludedValue ? '#94a3b8' : '#0f1f3d' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 italic leading-relaxed mb-5">{description}</p>
                <Link href="/order" className={`block text-center py-3 rounded-xl font-bold text-sm transition-all mb-2 ${p.popular ? 'bg-blue-600 text-white hover:bg-blue-500 btn-glow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>
                  {t('care.choosePlan')}
                </Link>
                <AddToCartButton id={p.id} />
              </div>
              )
            })}
          </div>

          <div style={{ marginTop: 20, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.7, maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
            <strong>{t('care.noteStrong')}</strong>{' '}{t('care.noteText')}
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
                <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">{tp('custom.eyebrow')}</div>
                <h2 className="font-display text-3xl font-extrabold text-white mb-2">{tp('custom.title')}</h2>
                <div className="font-display text-4xl font-extrabold text-white mb-2">{t('custom.from')} {money(isMk ? 3000 : 49)}<span className="text-lg font-normal text-white/50">{tp('perMo')}</span></div>
                <p className="text-white/55 text-sm mb-7">{tp('custom.subtitle')}</p>
                <ul className="space-y-2.5">
                  {(tp.raw('custom.features') as string[]).map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-blue-400 font-bold">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-8">
                <h3 className="font-display font-extrabold text-white text-xl mb-3">{tp('custom.boxTitle')}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-7">
                  {tp('custom.boxText')}
                </p>
                <Link href="/order?package=custom" className="block w-full text-center py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-blue-50 transition-all mb-3" style={{ color: '#0f1f3d' }}>
                  {tp('custom.cta')}
                </Link>
                <p className="text-white/35 text-xs leading-relaxed">
                  {tp('custom.boxNote')}
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
            <div className="section-label">{t('extra.label')}</div>
            <h2 className="font-display text-3xl font-extrabold text-slate-800 mb-3">{t('extra.title')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">{t('extra.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div>{t('extra.colService')}</div>
              <div className="text-center">{t('extra.colPrice')}</div>
              <div className="text-right">{t('extra.colBilling')}</div>
            </div>
            {(t.raw('extra.rows') as ExtraRow[]).map((row, i, arr) => (
              <div key={row.service} className={`grid grid-cols-3 px-5 py-4 text-sm items-center ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="text-slate-700 font-medium">{row.service}</div>
                <div className="text-center font-semibold text-slate-800">{row.price}</div>
                <div className="text-right text-xs text-slate-400">{row.billing}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">{t('extra.footnote')}</p>
        </div>
      </section>

      {/* ── NOT INCLUDED / RULES ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-display font-bold text-amber-800 text-lg">{t('notIncluded.title')}</h3>
              </div>
              <ul className="space-y-2.5">
                {(t.raw('notIncluded.items') as string[]).map(item => (
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
                <h3 className="font-display font-bold text-slate-800 text-lg">{t('howItWorks.title')}</h3>
              </div>
              <ul className="space-y-2.5">
                {(t.raw('howItWorks.items') as string[]).map(item => (
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
            <div className="section-label">{t('faq.label')}</div>
            <h2 className="font-display text-3xl font-extrabold text-slate-800">{t('faq.title')}</h2>
          </div>

          <div className="space-y-4">
            {/* Q1 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                {t('faq.q1')}
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 space-y-3">
                <p>{t('faq.q1p1')}</p>
                <p>{t('faq.q1p2')}</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 mt-2">
                  <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">{t('faq.q1summary')}</div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-slate-400 mt-0.5">→</span><span><strong>{t('faq.q1s1a')}</strong>{t('faq.q1s1b')}</span></div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong>{t('faq.q1s2a')}</strong>{t('faq.q1s2b')}</span></div>
                  <div className="flex items-start gap-2 text-xs"><span className="text-slate-400 mt-0.5">→</span><span><strong>{t('faq.q1s3a')}</strong>{t('faq.q1s3b')}</span></div>
                </div>
              </div>
            </div>

            {/* Q2 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                {t('faq.q2')}
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {t('faq.q2a')}
              </div>
            </div>

            {/* Q3 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                {t('faq.q3')}
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {t('faq.q3a')}
              </div>
            </div>

            {/* Q4 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 font-display font-bold text-slate-800">
                {t('faq.q4')}
              </div>
              <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {t('faq.q4a')}
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
          <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-white/55 text-lg mb-9">{t('cta.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/review" className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white">
              {t('cta.demo')}
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
              {t('cta.ask')}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
