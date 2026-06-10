'use client'
import { useState } from 'react'

export function PayInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function pay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Payment failed to start')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed to start')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={loading}
        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60 whitespace-nowrap"
        style={{ background: '#2563eb' }}
      >
        {loading ? 'Opening...' : '💳 Pay Now'}
      </button>
      {error && <div className="text-[10px] text-red-500 mt-1 max-w-[140px]">{error}</div>}
    </div>
  )
}
