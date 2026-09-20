'use client'
import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { useCart } from '@/components/public/Cart'
import { Spinner } from '@/components/ui'
import { fbTrack, setPendingPurchase } from '@/lib/fbpixel'
import { regionFromLocale } from '@/i18n/routing'
import { formatPrice, chargeCurrencyForRegion, eurFromMkd } from '@/lib/money'

type ApiPlan = {
  id: string
  name: string
  description: string
  category: string
  price: number
  currency: string
  billing_interval: 'month' | null
  sale_active: boolean
  effective_price: number
}

type AppliedCoupon = { code: string; percent_off: number | null; amount_off: number | null }

export default function CartPage() {
  const { items, remove } = useCart()
  const locale = useLocale()
  const t = useTranslations('cart')
  const region = regionFromLocale(locale)
  const displayCurrency = region === 'mk' ? 'MKD' : 'USD'
  const fmt = (n: number) => formatPrice(n, displayCurrency, locale)
  const [plans, setPlans] = useState<ApiPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Coupon
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    fetch(`/api/plans?region=${region}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPlans(data) })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [region])

  const cartItems = items.map(id => plans.find(p => p.id === id)).filter(Boolean) as ApiPlan[]
  const oneTimeTotal = cartItems.filter(i => !i.billing_interval).reduce((s, i) => s + i.effective_price, 0)
  const monthlyTotal = cartItems.filter(i => i.billing_interval === 'month').reduce((s, i) => s + i.effective_price, 0)
  const dueToday = oneTimeTotal + monthlyTotal

  const discountAmount = coupon
    ? coupon.percent_off
      ? Math.round(dueToday * coupon.percent_off) / 100
      : Math.min(coupon.amount_off || 0, dueToday)
    : 0

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponBusy(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, locale }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('invalidCoupon'))
      setCoupon(data)
      setCouponInput('')
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : t('invalidCoupon'))
    } finally {
      setCouponBusy(false)
    }
  }

  async function checkout() {
    setLoading(true)
    setError('')
    const netTotal = Math.max(0, Math.round((dueToday - discountAmount) * 100) / 100)
    fbTrack('InitiateCheckout', {
      content_ids: items,
      content_type: 'product',
      num_items: items.length,
      value: netTotal,
      currency: displayCurrency,
    })
    // Stash so the success page can fire Purchase with the order value.
    setPendingPurchase({ value: netTotal, currency: displayCurrency, content_ids: items, num_items: items.length })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, region, locale, ...(coupon ? { coupon_code: coupon.code } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('checkoutFailed'))
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : t('checkoutFailed'))
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />
      <section className="text-white py-14 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold">{t('title')}</h1>
          <p className="text-white/65 mt-2">{t('subtitle')}</p>
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 min-h-[50vh]">
        <div className="max-w-3xl mx-auto">
          {plansLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !cartItems.length ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="font-display text-xl font-extrabold text-slate-800 mb-2">{t('emptyTitle')}</h2>
              <p className="text-slate-500 text-sm mb-6">{t('emptyDesc')}</p>
              <Link href="/pricing" className="btn-primary">{t('emptyCta')}</Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="card overflow-hidden">
                {cartItems.map((item, i) => (
                  <div key={item.id} className={`flex items-center gap-4 px-6 py-4 ${i < cartItems.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {item.name}
                        {item.sale_active && item.effective_price < item.price && (
                          <span className="discount-badge">{t('sale')}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{item.category} · {item.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-extrabold text-slate-800">
                        {item.sale_active && item.effective_price < item.price && (
                          <span className="text-xs font-medium text-slate-400 line-through mr-1.5">{fmt(item.price)}</span>
                        )}
                        {fmt(item.effective_price)}{item.billing_interval && <span className="text-xs font-medium text-slate-400">{t('perMonth')}</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.billing_interval ? t('monthlySubscription') : t('oneTime')}</div>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 flex-shrink-0"
                      aria-label={t('ariaRemove', { name: item.name })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="card p-5">
                {coupon ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="font-bold text-green-700">🎟️ {coupon.code}</span>
                      <span className="text-slate-500 ml-2">
                        {coupon.percent_off
                          ? t('discountPercentApplied', { percent: coupon.percent_off })
                          : t('discountAmountApplied', { amount: fmt(coupon.amount_off || 0) })}
                      </span>
                    </div>
                    <button onClick={() => setCoupon(null)} className="text-xs font-semibold text-red-500 hover:text-red-600">{t('remove')}</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        className="form-input flex-1"
                        placeholder={t('couponPlaceholder')}
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      />
                      <button onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()} className="btn-ghost px-5 flex-shrink-0">
                        {couponBusy ? t('checking') : t('apply')}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                  </>
                )}
              </div>

              <div className="card p-6">
                <div className="space-y-2 mb-5">
                  {oneTimeTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t('oneTimeTotal')}</span>
                      <span className="font-bold text-slate-800">{fmt(oneTimeTotal)}</span>
                    </div>
                  )}
                  {monthlyTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t('monthlyTotal')}</span>
                      <span className="font-bold text-slate-800">{fmt(monthlyTotal)}{t('perMonth')}</span>
                    </div>
                  )}
                  {coupon && discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">{t('couponDiscount', { code: coupon.code })}</span>
                      <span className="font-bold text-green-600">−{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <span className="font-display font-bold text-slate-800">{t('dueToday')}</span>
                    <span className="font-display text-xl font-extrabold text-slate-800">
                      {fmt(Math.max(0, dueToday - discountAmount))}
                    </span>
                  </div>
                  {region === 'mk' && dueToday - discountAmount > 0 && (
                    <p className="text-xs text-slate-400">
                      Плаќањата се процесираат преку Stripe во евра — ќе бидете наплатени приближно €{eurFromMkd(Math.max(0, dueToday - discountAmount)).toFixed(2)} (цената е прикажана во денари).
                    </p>
                  )}
                  {monthlyTotal > 0 && (
                    <p className="text-xs text-slate-400">
                      {t('renewNote', { total: fmt(monthlyTotal), couponNote: coupon ? t('couponFirstPayment') : '' })}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={checkout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm text-white rounded-xl transition-all disabled:opacity-60"
                  style={{ background: '#2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}
                >
                  {loading ? <><Spinner size="sm" /> {t('redirecting')}</> : t('checkoutBtn')}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  {t('checkoutNote')}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </>
  )
}
