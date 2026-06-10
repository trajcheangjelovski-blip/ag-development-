// portfolio/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Portfolio — AG Development', description: 'Website projects and tech support work completed for small US businesses.' }

const projects = [
  { type: 'E-commerce', name: 'Coastal Candle Co.', desc: 'Custom Shopify store with product customization options and subscription box integration. Redesigned product pages and checkout flow.', tags: ['Shopify', 'Custom Theme', 'Email Marketing'], result: 'Online sales increased 40% in first 3 months.' },
  { type: 'Healthcare', name: 'Green Valley Dental', desc: 'Clean WordPress site with online appointment booking, staff bios, patient forms, and Google My Business integration.', tags: ['WordPress', 'Booking Plugin', 'SEO'], result: 'New patient inquiries up 60% after launch.' },
  { type: 'Hospitality', name: 'Lake Tahoe Rentals', desc: 'Property listing site with booking inquiry forms, full photo galleries, local area guides, and availability calendar.', tags: ['WordPress', 'Elementor', 'Custom CSS'], result: 'Summer booking inquiries tripled.' },
  { type: 'Automotive', name: 'Precision Auto Repair', desc: 'Full business website plus Shopify integration for online parts sales. Custom service booking form and Google Maps integration.', tags: ['WordPress', 'Shopify', 'Custom Forms'], result: 'Online parts sales launched — $8K revenue in first month.' },
  { type: 'Retail', name: 'Bloom Florist', desc: 'Beautiful e-commerce site with seasonal collections, gift builder tool, and local delivery zone map. WooCommerce integration.', tags: ['WordPress', 'WooCommerce', 'Stripe'], result: 'Online orders now 30% of all revenue.' },
  { type: 'Health & Wellness', name: 'Sunrise Fitness Studio', desc: 'Modern site with class schedules, trainer profiles, online class signup, and membership inquiry forms. Integrated with Calendly.', tags: ['WordPress', 'Calendly', 'Mailchimp'], result: 'New memberships doubled within 6 weeks of launch.' },
]

export default function PortfolioPage() {
  return (
    <>
      <PublicHeader />
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Our Work</div>
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">Websites & Tech Support That Deliver Results</h1>
          <p className="text-white/75 text-lg">A collection of website projects and digital upgrades we've completed for small US businesses.</p>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <div key={p.name} className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="h-44 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3360 100%)' }}>
                  <div className="text-center">
                    <div className="font-display font-bold text-white/60 text-xl">{p.name}</div>
                    <div className="text-white/30 text-xs mt-1">Portfolio Preview</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">{p.type}</div>
                  <h3 className="font-display font-bold text-slate-800 mb-2">{p.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{t}</span>)}
                  </div>
                  <div className="rounded-lg border-l-4 border-green-500 bg-green-50 px-3 py-2 text-xs text-green-800">
                    📈 {p.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 text-center text-white" style={{ background: '#0f1f3d' }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">Want to See Your Business Here?</h2>
        <p className="text-white/70 mb-7">Let's build something great together.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/review" className="btn-primary px-7 py-3.5">Get Free Website Review →</Link>
          <Link href="/contact" className="btn-outline-white px-7 py-3.5">Contact Us</Link>
        </div>
      </section>
      <PublicFooter />
    </>
  )
}
