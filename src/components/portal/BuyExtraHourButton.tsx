'use client'
import { useState } from 'react'

// One-click Stripe checkout for an extra support hour ($39 by default,
// price managed in Admin → Plans & Coupons as "Extra Support Hour").
export function BuyExtraHourButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function buy() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ['extra-hour'] }),
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
    <div>
      <button
        onClick={buy}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60 whitespace-nowrap"
        style={{ background: '#2563eb' }}
      >
        {loading ? 'Opening…' : '⚡ Buy Extra Support Hour'}
      </button>
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  )
}
