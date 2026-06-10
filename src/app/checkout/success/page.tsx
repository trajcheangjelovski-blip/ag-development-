'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { useCart } from '@/components/public/Cart'

export default function CheckoutSuccessPage() {
  const { clear } = useCart()

  // Payment completed — empty the cart
  useEffect(() => { clear() }, [clear])

  return (
    <>
      <PublicHeader />
      <section className="py-24 px-6 bg-slate-50 min-h-[60vh] flex items-center">
        <div className="max-w-lg mx-auto w-full">
          <div className="card p-12 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-3">Payment Successful!</h1>
            <p className="text-slate-500 leading-relaxed mb-3">
              Thank you for your order. A receipt has been sent to your email by Stripe.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              Our team has been notified and will reach out within 1 business day to get started on your services.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className="btn-primary">Back to Home</Link>
              <Link href="/contact" className="btn-ghost">Questions? Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </>
  )
}
