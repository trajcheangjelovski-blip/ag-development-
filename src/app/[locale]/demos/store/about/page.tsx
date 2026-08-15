// demos/store/about/page.tsx — brand story (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import { StoreNav, StoreFooter } from '@/components/demos/store/StoreChrome'
import { IMG } from '@/components/demos/store/data'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Urban Threads (Demo)',
  description: 'The Urban Threads story. Demo store by AG Development.',
}

export default function StoreAbout() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <DemoBanner />
      <StoreNav active="About" />

      {/* Hero */}
      <header className="relative px-6 py-28 text-center text-white overflow-hidden" style={{ background: `linear-gradient(rgba(28,25,23,0.6), rgba(28,25,23,0.75)), url('${IMG('1441986300917-64674bd600d8', 1600, 700)}') center/cover no-repeat, #1c1917` }}>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="uppercase tracking-widest text-xs font-bold text-neutral-300 mb-4 animate-fade-up">Our Story</div>
          <h1 className="font-extrabold text-4xl sm:text-5xl mb-5 animate-fade-up-1">Clothing made to last, not to last one season</h1>
          <p className="text-neutral-200 animate-fade-up-2">We started Urban Threads in 2016 with one idea: everyday basics shouldn't cost the earth — or fall apart after ten washes.</p>
        </div>
      </header>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="aspect-[4/3] rounded-2xl" style={{ background: `url('${IMG('1489987707025-afc232f7ea0f', 800, 600)}') center/cover no-repeat, #d6d3d1` }} />
        <div>
          <h2 className="font-extrabold text-3xl mb-4">Built on better basics</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">Every piece begins with the fabric. We work directly with mills that share our standards for quality and fair labour, then cut in small batches to reduce waste.</p>
          <p className="text-neutral-600 leading-relaxed">The result is a tight, considered collection of essentials you'll actually reach for — designed to mix, match and last for years.</p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
          {[
            ['🌱', 'Responsibly sourced', 'Organic and recycled fibres, traceable from farm to finish.'],
            ['🧵', 'Made to last', 'Reinforced seams and pre-washed fabric that holds its shape.'],
            ['🤝', 'Fair by design', 'Audited factories, fair wages, and no rushed deadlines.'],
          ].map(([i, t, s]) => (
            <div key={t} className="bg-white rounded-2xl border border-neutral-200 p-7">
              <div className="text-3xl mb-3">{i}</div>
              <div className="font-bold text-lg mb-2">{t}</div>
              <p className="text-sm text-neutral-500 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[['2016', 'Founded'], ['180k+', 'Happy customers'], ['92%', 'Organic materials'], ['12', 'Partner mills']].map(([n, l]) => (
          <div key={l}>
            <div className="font-extrabold text-4xl mb-1">{n}</div>
            <div className="text-sm text-neutral-500">{l}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center" style={{ background: '#f5f5f4' }}>
        <h2 className="font-extrabold text-3xl mb-3">Find your new favourites</h2>
        <p className="text-neutral-600 mb-7">Explore the latest collection.</p>
        <Link href="/demos/store/shop" className="inline-block bg-neutral-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-neutral-700 hover:scale-105 transition-all">Shop Now</Link>
      </section>

      <StoreFooter />
    </div>
  )
}
