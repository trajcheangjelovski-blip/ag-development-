// portfolio/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio — AG Development',
  description: 'Live, clickable website demos and graphic design work by AG Development. WordPress, Shopify and business websites for small companies.',
}

// Live, clickable demo websites — each opens as a real, browsable site.
const websites = [
  {
    slug: 'restaurant',
    name: 'Bella Cucina',
    type: 'Restaurant Website',
    desc: 'Full menu, photo gallery and table reservations for an Italian restaurant.',
    tags: ['WordPress-style', 'Menu', 'Reservations'],
    grad: 'linear-gradient(135deg, #b45309 0%, #1a1410 120%)',
  },
  {
    slug: 'dental',
    name: 'BrightSmile Dental',
    type: 'Clinic Website',
    desc: 'Service pages, team profiles and online appointment booking for a dental clinic.',
    tags: ['WordPress-style', 'Booking', 'SEO'],
    grad: 'linear-gradient(135deg, #38bdf8 0%, #0c4a6e 120%)',
  },
  {
    slug: 'fitness',
    name: 'PulseFit Studio',
    type: 'Fitness Website',
    desc: 'Class schedule, membership pricing and trainer profiles for a gym.',
    tags: ['WordPress-style', 'Pricing', 'Schedule'],
    grad: 'linear-gradient(135deg, #65a30d 0%, #0b0f0a 120%)',
  },
  {
    slug: 'store',
    name: 'Urban Threads',
    type: 'Shopify-style Store',
    desc: 'Product grid, categories, sale badges and checkout-ready layout for an online shop.',
    tags: ['Shopify', 'E-commerce', 'Product pages'],
    grad: 'linear-gradient(135deg, #57534e 0%, #1c1917 120%)',
  },
]

// Graphic design work. To show real pieces, add an `img` path pointing to a file
// you've dropped in  public/portfolio/designs/  e.g. { img: '/portfolio/designs/post1.jpg', title: '...' }.
// Items without an `img` render as a labelled placeholder tile.
const designs: { title: string; kind: string; grad: string; img?: string }[] = [
  { title: 'Social Media Posts', kind: 'Instagram & Facebook', grad: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' },
  { title: 'Logos & Branding', kind: 'Identity design', grad: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' },
  { title: 'Banners & Ads', kind: 'Promotions', grad: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { title: 'Print & Flyers', kind: 'Menus, cards, flyers', grad: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
]

export default function PortfolioPage() {
  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Our Work</div>
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">Websites you can actually click through</h1>
          <p className="text-white/75 text-lg">Live, interactive demos of the kinds of sites I build for small businesses — plus a look at graphic design work.</p>
        </div>
      </section>

      {/* Websites */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Websites</div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800">Live website demos</h2>
            </div>
            <span className="text-sm text-slate-500">Click any project to open the full, browsable site →</span>
          </div>
          <p className="text-slate-600 max-w-2xl mb-8">
            Each demo is a real, working front-end you can explore on any device. Want a closer look at a specific
            style? I can send you a private demo link to share and review.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {websites.map(w => (
              <Link
                key={w.slug}
                href={`/demos/${w.slug}`}
                target="_blank"
                rel="noreferrer"
                className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all group"
              >
                <div className="h-52 flex items-center justify-center relative" style={{ background: w.grad }}>
                  <div className="text-center">
                    <div className="font-display font-extrabold text-white text-2xl drop-shadow">{w.name}</div>
                    <div className="text-white/70 text-xs mt-1 uppercase tracking-widest">{w.type}</div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Open live demo →
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-slate-800 mb-2">{w.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{w.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {w.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">{t}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Graphic design */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Graphic Design</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">Design &amp; social media work</h2>
          <p className="text-slate-600 max-w-2xl mb-8">Social media posts, logos, banners and print materials designed to match each brand.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {designs.map(d => (
              <div key={d.title} className="card overflow-hidden">
                {d.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.img} alt={d.title} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="aspect-square flex items-center justify-center text-center p-4" style={{ background: d.grad }}>
                    <div>
                      <div className="font-display font-bold text-white text-lg drop-shadow">{d.title}</div>
                      <div className="text-white/80 text-xs mt-1">{d.kind}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-5">More design samples coming soon.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center text-white" style={{ background: '#0f1f3d' }}>
        <h2 className="font-display text-3xl font-extrabold mb-3">Want a website like these?</h2>
        <p className="text-white/70 mb-7">I'll build you a clean, modern site — and send you a private demo before you commit.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/review" className="btn-primary px-7 py-3.5">Get a Free Website Review →</Link>
          <Link href="/contact" className="btn-outline-white px-7 py-3.5">Start Your Website Project</Link>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
