// demos/restaurant/page.tsx — standalone demo website (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bella Cucina — Italian Restaurant (Demo)',
  description: 'Demo restaurant website built by AG Development.',
}

const menu = [
  {
    category: 'Antipasti',
    items: [
      { name: 'Bruschetta Classica', desc: 'Grilled bread, vine tomatoes, basil, garlic', price: '$9' },
      { name: 'Caprese di Bufala', desc: 'Buffalo mozzarella, heirloom tomato, basil oil', price: '$12' },
      { name: 'Arancini Siciliani', desc: 'Crispy risotto balls, ragù, peas', price: '$10' },
    ],
  },
  {
    category: 'Pasta & Risotto',
    items: [
      { name: 'Tagliatelle al Ragù', desc: 'Slow-cooked beef ragù, fresh egg pasta', price: '$18' },
      { name: 'Spaghetti alle Vongole', desc: 'Clams, white wine, garlic, chili', price: '$21' },
      { name: 'Risotto ai Funghi', desc: 'Porcini mushrooms, parmigiano, white wine', price: '$19' },
      { name: 'Gnocchi al Pesto', desc: 'Potato gnocchi, basil pesto, pine nuts', price: '$17' },
    ],
  },
  {
    category: 'Pizza',
    items: [
      { name: 'Margherita DOC', desc: 'San Marzano tomato, fior di latte, basil', price: '$15' },
      { name: 'Diavola', desc: 'Spicy salami, chili, mozzarella', price: '$17' },
    ],
  },
  {
    category: 'Secondi',
    items: [
      { name: 'Branzino al Forno', desc: 'Oven-baked sea bass, lemon, herbs', price: '$24' },
      { name: 'Ossobuco alla Milanese', desc: 'Braised veal shank, saffron risotto, gremolata', price: '$28' },
    ],
  },
  {
    category: 'Dolci',
    items: [
      { name: 'Tiramisù della Casa', desc: 'Mascarpone, espresso, cocoa', price: '$8' },
      { name: 'Panna Cotta', desc: 'Vanilla cream, mixed berry coulis', price: '$8' },
    ],
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1410" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v7a2 2 0 0 0 4 0V2M8 9v13" />
          <path d="M17 2c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5zM17 11v11" />
        </svg>
      </span>
      <span className="font-serif text-2xl tracking-wide text-amber-300">Bella Cucina</span>
    </div>
  )
}

export default function RestaurantDemo() {
  const navLinks = [['About', '#about'], ['Menu', '#menu'], ['Gallery', '#gallery'], ['Visit', '#visit']]
  return (
    <div className="min-h-screen bg-[#1a1410] text-stone-100 font-sans">
      <DemoBanner />

      {/* Nav */}
      <nav className="sticky top-[37px] z-40 bg-[#1a1410]/90 backdrop-blur border-b border-amber-900/40">
        <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <input type="checkbox" id="nav-rest" className="peer hidden" />
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm text-stone-300">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="hover:text-amber-300 transition-colors">{l}</a>)}
          </div>
          <a href="#visit" className="hidden md:inline-block bg-amber-400 text-stone-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-amber-300 hover:scale-105 transition-all">Book a Table</a>
          <label htmlFor="nav-rest" className="md:hidden cursor-pointer text-2xl text-amber-300 select-none">☰</label>
          {/* Mobile menu */}
          <div className="absolute top-16 inset-x-0 hidden peer-checked:flex md:peer-checked:hidden flex-col gap-1 bg-[#211a12] border-y border-amber-900/40 p-4 animate-fade-up">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="py-2 text-stone-200 hover:text-amber-300 transition-colors">{l}</a>)}
            <a href="#visit" className="mt-2 text-center bg-amber-400 text-stone-900 font-bold px-5 py-2.5 rounded-full">Book a Table</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative px-6 py-28 sm:py-36 text-center overflow-hidden" style={{ background: "linear-gradient(rgba(26,20,16,0.80), rgba(26,20,16,0.93)), url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&h=900&fit=crop&q=80') center/cover no-repeat, radial-gradient(ellipse at top, #3a2a17 0%, #1a1410 70%)" }}>
        {/* animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-16 w-80 h-80 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(180,83,9,0.45)' }} />
          <div className="absolute top-10 -right-10 w-72 h-72 rounded-full blur-3xl animate-orb-pulse" style={{ background: 'rgba(251,191,36,0.25)' }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full blur-3xl animate-float-alt" style={{ background: 'rgba(120,53,15,0.5)' }} />
        </div>
        <div className="relative z-10">
          <div className="text-amber-400 uppercase tracking-[0.3em] text-xs font-bold mb-5 animate-fade-up">Authentic Italian · Est. 1998</div>
          <h1 className="font-serif text-5xl sm:text-7xl text-stone-50 mb-6 leading-tight animate-fade-up-1">A taste of Italy,<br /><span className="gradient-text-gold">made fresh daily</span></h1>
          <p className="text-stone-300 text-lg max-w-xl mx-auto mb-9 animate-fade-up-2">Handmade pasta, wood-fired pizza and a cellar of Italian wines — in the heart of the old town.</p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-up-3">
            <a href="#menu" className="bg-amber-400 text-stone-900 font-bold px-8 py-3.5 rounded-full hover:bg-amber-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30 transition-all">View the Menu</a>
            <a href="#visit" className="border border-stone-600 text-stone-200 font-bold px-8 py-3.5 rounded-full hover:border-amber-400 hover:text-amber-300 hover:scale-105 transition-all">Reservations</a>
          </div>
          <div className="mt-16 flex justify-center animate-scroll-bounce"><span className="text-amber-400/60 text-2xl">↓</span></div>
        </div>
      </header>

      {/* About */}
      <section id="about" className="px-6 py-24 max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="aspect-square rounded-2xl shadow-2xl animate-float-slow bg-cover bg-center" style={{ background: "url('https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=800&fit=crop&q=80') center/cover no-repeat, linear-gradient(135deg, #b45309 0%, #78350f 100%)" }} />
        <div>
          <div className="text-amber-400 uppercase tracking-widest text-xs font-bold mb-3">Our Story</div>
          <h2 className="font-serif text-4xl text-stone-50 mb-5">Family recipes, three generations deep</h2>
          <p className="text-stone-300 leading-relaxed mb-4">Every dish at Bella Cucina starts the way Nonna taught us — by hand, with patience, and the best seasonal ingredients we can find.</p>
          <p className="text-stone-300 leading-relaxed">From our daily fresh pasta to our 48-hour fermented pizza dough, we believe great food takes time. Pull up a chair and stay a while.</p>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="px-6 py-24" style={{ background: '#211a12' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-amber-400 uppercase tracking-widest text-xs font-bold mb-3">Our Menu</div>
            <h2 className="font-serif text-4xl text-stone-50">Favourites from the kitchen</h2>
          </div>
          <div className="space-y-12">
            {menu.map(group => (
              <div key={group.category}>
                <h3 className="font-serif text-2xl text-amber-300 mb-5 flex items-center gap-3">
                  <span className="whitespace-nowrap">{group.category}</span>
                  <span className="flex-1 h-px bg-amber-900/40" />
                </h3>
                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-2">
                  {group.items.map(m => (
                    <div key={m.name} className="flex justify-between gap-4 border-b border-amber-900/30 py-4 px-3 rounded-lg hover:bg-amber-950/30 transition-colors">
                      <div>
                        <div className="font-serif text-xl text-stone-100">{m.name}</div>
                        <div className="text-sm text-stone-400">{m.desc}</div>
                      </div>
                      <div className="font-serif text-xl text-amber-300 shrink-0">{m.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-amber-400 uppercase tracking-widest text-xs font-bold mb-3">Gallery</div>
          <h2 className="font-serif text-4xl text-stone-50">A look inside</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop&q=80', c: '#7c2d12' },
            { img: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop&q=80', c: '#92400e' },
            { img: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=600&h=600&fit=crop&q=80', c: '#b45309' },
            { img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=600&fit=crop&q=80', c: '#a16207' },
            { img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=600&fit=crop&q=80', c: '#78350f' },
            { img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=600&fit=crop&q=80', c: '#854d0e' },
            { img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=600&fit=crop&q=80', c: '#9a3412' },
            { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop&q=80', c: '#a16207' },
          ].map((g, i) => (
            <div key={i} className="aspect-square rounded-xl cursor-pointer transition-transform duration-300 hover:scale-[1.04] hover:shadow-2xl" style={{ background: `url('${g.img}') center/cover no-repeat, linear-gradient(135deg, ${g.c} 0%, #1a1410 130%)` }} />
          ))}
        </div>
      </section>

      {/* Visit */}
      <section id="visit" className="relative px-6 py-24 overflow-hidden" style={{ background: 'radial-gradient(ellipse at bottom, #3a2a17 0%, #1a1410 70%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-orb-pulse" style={{ background: 'rgba(251,191,36,0.18)' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="text-amber-400 uppercase tracking-widest text-xs font-bold mb-3">Visit Us</div>
          <h2 className="font-serif text-4xl text-stone-50 mb-8">Come dine with us</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-stone-300 mb-10">
            <div><div className="text-amber-300 font-bold mb-1">Hours</div>Tue–Sun · 5pm–11pm</div>
            <div><div className="text-amber-300 font-bold mb-1">Find us</div>14 Old Town Square</div>
            <div><div className="text-amber-300 font-bold mb-1">Reserve</div>(555) 012-3456</div>
          </div>
          <a href="#" className="inline-block bg-amber-400 text-stone-900 font-bold px-9 py-3.5 rounded-full hover:bg-amber-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30 transition-all">Book a Table</a>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-stone-500 text-sm border-t border-amber-900/30">
        Bella Cucina · Demo website by AG Development
      </footer>
    </div>
  )
}
