// demos/store/product/page.tsx — product detail (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import { StoreNav, StoreFooter } from '@/components/demos/store/StoreChrome'
import { products, IMG } from '@/components/demos/store/data'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oversized Cotton Tee — Urban Threads (Demo)',
  description: 'Product detail demo page. Demo store by AG Development.',
}

const PROD = '/demos/store/product'
const SHOP = '/demos/store/shop'

const gallery = [
  IMG('1521572163474-6864f9cf17ab', 800, 1000),
  IMG('1581655353564-df123a1eb820', 800, 1000),
  IMG('1576566588028-4147f3842f27', 800, 1000),
  IMG('1503341504253-dff4815485f1', 800, 1000),
]

export default function ProductPage() {
  const related = products.slice(1, 5)
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <DemoBanner />
      <StoreNav active="Shop" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-xs text-neutral-500 mb-6">
          <Link href={SHOP} className="hover:text-neutral-900">Shop</Link> / <span className="text-neutral-700">Oversized Cotton Tee</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-3" style={{ background: `url('${gallery[0]}') center/cover no-repeat, #e7e5e4` }} />
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <div key={i} className={`aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${i === 0 ? 'ring-2 ring-neutral-900' : 'hover:opacity-80'}`} style={{ background: `url('${g}') center/cover no-repeat, #e7e5e4` }} />
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-neutral-400 mb-2">Tops</div>
            <h1 className="font-extrabold text-3xl mb-3">Oversized Cotton Tee</h1>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-yellow-500 text-sm">★★★★★</span>
              <span className="text-sm text-neutral-500">128 reviews</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-extrabold text-2xl">$32</span>
              <span className="text-neutral-400 line-through">$45</span>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">Save 29%</span>
            </div>
            <p className="text-neutral-600 leading-relaxed mb-6">A relaxed, drop-shoulder tee cut from heavyweight 100% organic cotton. Pre-washed for a lived-in feel that holds its shape wash after wash.</p>

            <div className="mb-5">
              <div className="text-sm font-bold mb-2">Color</div>
              <div className="flex gap-2">
                {['#1c1917', '#e7e5e4', '#7f9cb5', '#8a7a64'].map((c, i) => (
                  <span key={c} className={`w-8 h-8 rounded-full cursor-pointer border ${i === 0 ? 'ring-2 ring-offset-2 ring-neutral-900' : 'border-neutral-300'}`} style={{ background: c }} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Size</span>
                <Link href="#" className="text-xs text-neutral-500 underline">Size guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL'].map((s, i) => (
                  <span key={s} className={`w-11 h-11 grid place-items-center rounded-lg border text-sm font-medium cursor-pointer transition-colors ${i === 2 ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300 hover:border-neutral-900'}`}>{s}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button className="flex-1 bg-neutral-900 text-white font-bold py-3.5 rounded-full hover:bg-neutral-700 hover:scale-[1.02] transition-all">Add to Cart · $32</button>
              <button className="w-12 grid place-items-center border border-neutral-300 rounded-full hover:border-neutral-900 transition-colors" aria-label="Add to wishlist">♡</button>
            </div>

            <div className="border-t border-neutral-200 divide-y divide-neutral-200">
              {[
                ['Description', 'Heavyweight 220gsm organic cotton. Drop shoulder, ribbed crew neck. Garment-washed for softness.'],
                ['Shipping & Returns', 'Free shipping over $75. Delivered in 2–4 business days. 30-day free returns.'],
                ['Materials & Care', '100% organic cotton. Machine wash cold, tumble dry low. Do not bleach.'],
              ].map(([t, body]) => (
                <details key={t} className="group py-3">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm">
                    {t}<span className="text-neutral-400 group-open:rotate-45 transition-transform text-lg">+</span>
                  </summary>
                  <p className="text-sm text-neutral-500 leading-relaxed mt-2">{body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        <section className="mt-20">
          <h2 className="font-extrabold text-2xl mb-8">You might also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-9">
            {related.map(p => (
              <Link key={p.name} href={PROD} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1" style={{ background: `url('${p.img}') center/cover no-repeat, linear-gradient(135deg, ${p.c} 0%, #78716c 160%)` }} />
                <div className="font-medium text-sm text-neutral-800">{p.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{p.price}</span>
                  {p.old && <span className="text-neutral-400 line-through text-xs">{p.old}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <StoreFooter />
    </div>
  )
}
