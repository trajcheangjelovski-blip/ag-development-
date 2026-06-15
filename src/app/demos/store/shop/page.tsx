// demos/store/shop/page.tsx — product listing (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import { StoreNav, StoreFooter } from '@/components/demos/store/StoreChrome'
import { products, categories } from '@/components/demos/store/data'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop — Urban Threads (Demo)',
  description: 'Browse the full Urban Threads collection. Demo store by AG Development.',
}

const PROD = '/demos/store/product'

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <DemoBanner />
      <StoreNav active="Shop" />

      {/* Page header */}
      <header className="px-6 py-12" style={{ background: '#f5f5f4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-xs text-neutral-500 mb-2">Home / Shop</div>
          <h1 className="font-extrabold text-4xl">All Products</h1>
          <p className="text-neutral-600 mt-2">{products.length} items · Autumn / Winter collection</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[200px_1fr] gap-10">
        {/* Sidebar filters */}
        <aside className="hidden lg:block">
          <div className="font-bold text-sm mb-3">Category</div>
          <ul className="space-y-2 mb-8 text-sm">
            {categories.map((c, i) => (
              <li key={c}><Link href="#" className={`hover:text-neutral-900 transition-colors ${i === 0 ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}>{c}</Link></li>
            ))}
          </ul>
          <div className="font-bold text-sm mb-3">Price</div>
          <ul className="space-y-2 mb-8 text-sm text-neutral-500">
            <li><Link href="#" className="hover:text-neutral-900">Under $25</Link></li>
            <li><Link href="#" className="hover:text-neutral-900">$25 – $50</Link></li>
            <li><Link href="#" className="hover:text-neutral-900">$50 – $100</Link></li>
            <li><Link href="#" className="hover:text-neutral-900">$100+</Link></li>
          </ul>
          <div className="font-bold text-sm mb-3">Size</div>
          <div className="flex flex-wrap gap-2">
            {['XS', 'S', 'M', 'L', 'XL'].map(s => (
              <span key={s} className="w-9 h-9 grid place-items-center border border-neutral-300 rounded text-xs font-medium hover:border-neutral-900 cursor-pointer transition-colors">{s}</span>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <Link key={c} href="#" className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all hover:scale-105 ${i === 0 ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'}`}>{c}</Link>
              ))}
            </div>
            <select className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:border-neutral-900">
              <option>Sort: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-9">
            {products.map(p => (
              <Link key={p.name} href={PROD} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1" style={{ background: `url('${p.img}') center/cover no-repeat, linear-gradient(135deg, ${p.c} 0%, #78716c 160%)` }}>
                  {p.old && <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded z-10">Sale</span>}
                  <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white text-neutral-900 text-center text-sm font-bold py-2.5 rounded-lg shadow hover:bg-neutral-900 hover:text-white transition-colors">View Product</div>
                  </div>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-400">{p.category}</div>
                <div className="font-medium text-sm text-neutral-800">{p.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{p.price}</span>
                  {p.old && <span className="text-neutral-400 line-through text-xs">{p.old}</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="border border-neutral-900 text-neutral-900 font-bold px-8 py-3 rounded-full hover:bg-neutral-900 hover:text-white transition-colors">Load more</button>
          </div>
        </div>
      </div>

      <StoreFooter />
    </div>
  )
}
