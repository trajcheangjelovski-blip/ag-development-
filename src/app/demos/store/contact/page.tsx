// demos/store/contact/page.tsx — contact (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import { StoreNav, StoreFooter } from '@/components/demos/store/StoreChrome'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Urban Threads (Demo)',
  description: 'Get in touch with Urban Threads. Demo store by AG Development.',
}

const faqs = [
  ['How long does shipping take?', 'Standard shipping is 2–4 business days. Orders over $75 ship free.'],
  ['What is your return policy?', 'Returns are free within 30 days of delivery, in original condition.'],
  ['Do you ship internationally?', 'Yes — to most countries. Duties are calculated at checkout.'],
  ['How do I track my order?', 'You\'ll get a tracking link by email the moment your order ships.'],
]

export default function StoreContact() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <DemoBanner />
      <StoreNav active="Contact" />

      <header className="px-6 py-12" style={{ background: '#f5f5f4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-xs text-neutral-500 mb-2">Home / Contact</div>
          <h1 className="font-extrabold text-4xl">Get in touch</h1>
          <p className="text-neutral-600 mt-2">We usually reply within one business day.</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Form */}
        <div>
          <h2 className="font-extrabold text-2xl mb-6">Send us a message</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="First name" className="border border-neutral-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-900" />
              <input placeholder="Last name" className="border border-neutral-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-900" />
            </div>
            <input placeholder="Email address" className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-900" />
            <select className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm text-neutral-600 focus:outline-none focus:border-neutral-900">
              <option>What's this about?</option>
              <option>Order question</option>
              <option>Returns &amp; exchanges</option>
              <option>Product question</option>
              <option>Something else</option>
            </select>
            <textarea rows={5} placeholder="Your message" className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 resize-none" />
            <button className="bg-neutral-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-neutral-700 hover:scale-[1.02] transition-all">Send message</button>
          </div>
        </div>

        {/* Info + FAQ */}
        <div>
          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {[
              ['Email', 'hello@urbanthreads.demo'],
              ['Phone', '(555) 700-1200'],
              ['Flagship store', '120 Market St, Portland'],
              ['Hours', 'Mon–Sat · 10am–7pm'],
            ].map(([t, v]) => (
              <div key={t} className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">{t}</div>
                <div className="font-semibold text-sm">{v}</div>
              </div>
            ))}
          </div>

          <div className="aspect-[16/9] rounded-xl mb-10 grid place-items-center text-neutral-400 text-sm" style={{ background: 'repeating-linear-gradient(45deg, #f5f5f4, #f5f5f4 12px, #ececeb 12px, #ececeb 24px)' }}>
            Map
          </div>

          <h2 className="font-extrabold text-2xl mb-4">FAQ</h2>
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm">
                  {q}<span className="text-neutral-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="text-sm text-neutral-500 leading-relaxed mt-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <StoreFooter />
    </div>
  )
}
