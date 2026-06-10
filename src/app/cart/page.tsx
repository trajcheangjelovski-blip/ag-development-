'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { useCart } from '@/components/public/Cart'
import { getCatalogItem } from '@/lib/catalog'
import { Spinner } from '@/components/ui'

export default function CartPage() {
  const { items, remove } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cartItems = items.map(getCatalogItem).filter(Boolean) as NonNullable<ReturnType<typeof getCatalogItem>>[]
  const oneTimeTotal = cartItems.filter(i => !i.interval).reduce((s, i) => s + i.price, 0)
  const monthlyTotal = cartItems.filter(i => i.interval === 'month').reduce((s, i) => s + i.price, 0)

  async function checkout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />
      <section className="text-white py-14 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold">Your Cart</h1>
          <p className="text-white/65 mt-2">Review your services, then pay securely with Stripe.</p>
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 min-h-[50vh]">
        <div className="max-w-3xl mx-auto">
          {!cartItems.length ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="font-display text-xl font-extrabold text-slate-800 mb-2">Your cart is empty</h2>
              <p className="text-slate-500 text-sm mb-6">Browse our packages and add the services your business needs.</p>
              <Link href="/pricing" className="btn-primary">View Pricing →</Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="card overflow-hidden">
                {cartItems.map((item, i) => (
                  <div key={item.id} className={`flex items-center gap-4 px-6 py-4 ${i < cartItems.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.category} · {item.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-extrabold text-slate-800">
                        ${item.price}{item.interval && <span className="text-xs font-medium text-slate-400">/mo</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.interval ? 'Monthly subscription' : 'One-time'}</div>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 flex-shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="card p-6">
                <div className="space-y-2 mb-5">
                  {oneTimeTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">One-time total</span>
                      <span className="font-bold text-slate-800">${oneTimeTotal}</span>
                    </div>
                  )}
                  {monthlyTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monthly subscription total</span>
                      <span className="font-bold text-slate-800">${monthlyTotal}/mo</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <span className="font-display font-bold text-slate-800">Due today</span>
                    <span className="font-display text-xl font-extrabold text-slate-800">${oneTimeTotal + monthlyTotal}</span>
                  </div>
                  {monthlyTotal > 0 && (
                    <p className="text-xs text-slate-400">
                      Subscriptions renew automatically at ${monthlyTotal}/month. Cancel per our terms (6-month minimum on care plans).
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
                  {loading ? <><Spinner size="sm" /> Redirecting to Stripe...</> : '🔒 Pay Securely with Stripe →'}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  You&apos;ll be redirected to Stripe&apos;s secure checkout. We never see or store your card details.
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
