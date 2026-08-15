// demos/store/page.tsx — Urban Threads home (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import { StoreNav, StoreFooter } from '@/components/demos/store/StoreChrome'
import { products, categories, IMG } from '@/components/demos/store/data'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Urban Threads — Online Store (Demo)',
  description: 'Demo e-commerce / Shopify-style store built by AG Development.',
}

const PROD = '/demos/store/product'
const SHOP = '/demos/store/shop'

export default function StoreHome() {
  const featured = products.slice(0, 8)
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <DemoBanner />
      <StoreNav active="Home" />

      {/* Hero */}
      <header className="grid md:grid-cols-2">
        <div className="flex items-center px-8 py-24 md:py-32" style={{ background: '#f5f5f4' }}>
          <div className="max-w-md mx-auto">
            <div className="uppercase tracking-widest text-xs font-bold text-neutral-500 mb-4 animate-fade-up">Autumn Collection</div>
            <h1 className="font-extrabold text-5xl leading-none mb-5 animate-fade-up-1">Wear it<br />your way.</h1>
            <p className="text-neutral-600 mb-8 animate-fade-up-2">Everyday essentials made from quality fabrics — designed to last and easy to style.</p>
            <Link href={SHOP} className="inline-block bg-neutral-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-neutral-700 hover:scale-105 hover:shadow-xl transition-all animate-fade-up-3">Shop the Collection</Link>
          </div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden" style={{ background: `url('${IMG('1490481651871-ab68de25d43d', 900, 1100)}') center/cover no-repeat, linear-gradient(135deg, #292524 0%, #57534e 100%)` }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      </header>

      {/* Category tiles */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Tops', img: IMG('1521572163474-6864f9cf17ab', 500, 600) },
            { name: 'Outerwear', img: IMG('1551537482-f2075a1d41f2', 500, 600) },
            { name: 'Accessories', img: IMG('1544816155-12df9643f363', 500, 600) },
            { name: 'Footwear', img: IMG('1542291026-7eec264c27ff', 500, 600) },
          ].map(cat => (
            <Link key={cat.name} href={SHOP} className="group relative aspect-[4/5] rounded-xl overflow-hidden" style={{ background: `url('${cat.img}') center/cover no-repeat, #d6d3d1` }}>
              <div className="absolute inset-0 bg-neutral-900/25 group-hover:bg-neutral-900/40 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white font-bold text-lg">{cat.name} <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-extrabold text-3xl">New Arrivals</h2>
          <Link href={SHOP} className="text-sm font-semibold underline underline-offset-4 hover:text-neutral-500">View all</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-9">
          {featured.map(p => (
            <Link key={p.name} href={PROD} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1" style={{ background: `url('${p.img}') center/cover no-repeat, linear-gradient(135deg, ${p.c} 0%, #78716c 160%)` }}>
                {p.old && <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded z-10">Sale</span>}
                <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white text-neutral-900 text-center text-sm font-bold py-2.5 rounded-lg shadow hover:bg-neutral-900 hover:text-white transition-colors">View Product</div>
                </div>
              </div>
              <div className="font-medium text-sm text-neutral-800">{p.name}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{p.price}</span>
                {p.old && <span className="text-neutral-400 line-through text-xs">{p.old}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promise strip */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['🚚', 'Free shipping', 'On orders over $75'], ['↩️', 'Easy returns', '30 days, no questions'], ['🌱', 'Responsibly made', 'Ethical factories'], ['🔒', 'Secure checkout', 'Encrypted payments']].map(([i, t, s]) => (
            <div key={t}>
              <div className="text-2xl mb-2">{i}</div>
              <div className="font-bold text-sm text-neutral-900">{t}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Promo */}
      <section className="relative px-6 py-24 text-center text-white overflow-hidden" style={{ background: `linear-gradient(rgba(28,25,23,0.72), rgba(28,25,23,0.85)), url('${IMG('1441984904996-e0b6ba687e04', 1600, 600)}') center/cover no-repeat, linear-gradient(135deg, #1c1917 0%, #44403c 100%)` }}>
        <div className="relative z-10">
          <div className="uppercase tracking-widest text-xs font-bold text-neutral-300 mb-4">Limited time</div>
          <h2 className="font-extrabold text-4xl sm:text-5xl mb-4">Up to 30% off sale</h2>
          <p className="text-neutral-200 mb-8">End-of-season styles, while stock lasts.</p>
          <Link href={SHOP} className="inline-block bg-white text-neutral-900 font-bold px-9 py-3.5 rounded-full hover:bg-neutral-200 hover:scale-105 transition-all">Shop Sale</Link>
        </div>
      </section>

      {/* Lookbook strip */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <div className="uppercase tracking-widest text-xs font-bold text-neutral-500 mb-2">@urbanthreads</div>
          <h2 className="font-extrabold text-3xl">From the lookbook</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {['1483985988355-763728e1935b', '1487222477894-8943e31ef7b2', '1485462537746-965f33f7f6a7', '1495121605193-b116b5b9c5fe', '1496747611176-843222e1e57c', '1469334031218-e382a71b716b'].map((id, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.05]" style={{ background: `url('${IMG(id, 400, 400)}') center/cover no-repeat, #d6d3d1` }} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="font-extrabold text-3xl mb-3">Get 10% off your first order</h2>
        <p className="text-neutral-600 mb-7">Join the list for early access to drops and exclusive offers.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" placeholder="Enter your email" className="flex-1 border border-neutral-300 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors" />
          <button className="bg-neutral-900 text-white font-bold px-7 py-3 rounded-full hover:bg-neutral-700 hover:scale-105 transition-all">Subscribe</button>
        </div>
      </section>

      <StoreFooter />
    </div>
  )
}
