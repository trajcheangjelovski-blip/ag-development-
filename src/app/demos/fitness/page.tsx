// demos/fitness/page.tsx — standalone demo website (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PulseFit Studio — Group Training (Demo)',
  description: 'Demo fitness studio website built by AG Development.',
}

const classes = [
  { name: 'HIIT Burn', time: 'Mon · Wed · Fri — 6:00am', tag: 'High intensity' },
  { name: 'Strength Lab', time: 'Tue · Thu — 7:00pm', tag: 'Build muscle' },
  { name: 'Power Yoga', time: 'Mon · Sat — 9:00am', tag: 'Mobility' },
  { name: 'Spin Sprint', time: 'Daily — 5:30pm', tag: 'Cardio' },
]

const plans = [
  { name: 'Drop-In', price: '$15', per: '/class', feats: ['Single class', 'No commitment', 'Book anytime'], hot: false },
  { name: 'Unlimited', price: '$89', per: '/month', feats: ['All classes', 'Free guest passes', 'App tracking', 'Priority booking'], hot: true },
  { name: 'Team', price: '$69', per: '/month', feats: ['8+ members', 'Shared dashboard', 'Custom schedule'], hot: false },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-xl shadow-lg shadow-lime-500/30" style={{ background: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0b0f0a"><path d="M13 2L4.5 13.5H11l-1.5 8.5L20 9.5h-6.5z" /></svg>
      </span>
      <span className="font-extrabold text-xl tracking-tight text-lime-400">PULSE<span className="text-white">FIT</span></span>
    </div>
  )
}

export default function FitnessDemo() {
  const navLinks = [['Classes', '#classes'], ['Pricing', '#pricing'], ['Trainers', '#trainers'], ['Contact', '#join']]
  return (
    <div className="min-h-screen bg-[#0b0f0a] text-zinc-100 font-sans">
      <DemoBanner />

      {/* Nav */}
      <nav className="sticky top-[37px] z-40 bg-[#0b0f0a]/90 backdrop-blur border-b border-lime-900/40">
        <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <input type="checkbox" id="nav-fit" className="peer hidden" />
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-300">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="hover:text-lime-400 transition-colors">{l}</a>)}
          </div>
          <a href="#join" className="hidden md:inline-block bg-lime-400 text-zinc-900 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-lime-300 hover:scale-105 transition-all">Free Trial</a>
          <label htmlFor="nav-fit" className="md:hidden cursor-pointer text-2xl text-lime-400 select-none">☰</label>
          <div className="absolute top-16 inset-x-0 hidden peer-checked:flex md:peer-checked:hidden flex-col gap-1 bg-[#11160e] border-y border-lime-900/40 p-4 animate-fade-up">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="py-2 text-zinc-200 hover:text-lime-400 transition-colors">{l}</a>)}
            <a href="#join" className="mt-2 text-center bg-lime-400 text-zinc-900 font-bold px-5 py-2.5 rounded-lg">Free Trial</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative px-6 py-28 sm:py-36 text-center overflow-hidden" style={{ background: "linear-gradient(rgba(11,15,10,0.72), rgba(11,15,10,0.9)), url('/demos/fitness/hero.jpg') center/cover no-repeat, radial-gradient(ellipse at center, #1a2410 0%, #0b0f0a 70%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 left-10 w-80 h-80 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(132,204,22,0.3)' }} />
          <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full blur-3xl animate-orb-pulse" style={{ background: 'rgba(163,230,53,0.22)' }} />
          <div className="absolute top-1/3 left-0 right-0">
            <div className="h-px w-full animate-sweep" style={{ background: 'linear-gradient(90deg, transparent, rgba(163,230,53,0.6), transparent)' }} />

            {/* Running */}
            <div className="absolute -top-6 left-0 animate-run-across" style={{ animationDuration: '7s', animationDelay: '-0.5s' }}>
              <svg className="animate-run-bob" width="26" height="26" viewBox="0 0 24 24" fill="#a3e635" style={{ filter: 'drop-shadow(0 0 6px rgba(163,230,53,0.6))' }}>
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
              </svg>
            </div>

            {/* Cycling */}
            <div className="absolute -top-5 left-0 animate-run-across" style={{ animationDuration: '11s', animationDelay: '-4s' }}>
              <svg className="animate-float" width="26" height="26" viewBox="0 0 24 24" fill="#a3e635" style={{ filter: 'drop-shadow(0 0 6px rgba(163,230,53,0.6))' }}>
                <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
              </svg>
            </div>

            {/* Strength Lab */}
            <div className="absolute -top-4 left-0 animate-run-across" style={{ animationDuration: '9s', animationDelay: '-6.5s' }}>
              <svg className="animate-float" width="24" height="24" viewBox="0 0 24 24" fill="#a3e635" style={{ filter: 'drop-shadow(0 0 6px rgba(163,230,53,0.6))' }}>
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L24 16.29z" />
              </svg>
            </div>

            {/* Tennis */}
            <div className="absolute -top-5 left-0 animate-run-across" style={{ animationDuration: '8s', animationDelay: '-2.5s' }}>
              <svg className="animate-float" width="24" height="24" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px rgba(163,230,53,0.6))' }}>
                <ellipse cx="9" cy="8" rx="5.3" ry="6.3" fill="none" stroke="#a3e635" strokeWidth="1.8" />
                <line x1="6.5" y1="13.2" x2="3.5" y2="21" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="16" r="2.3" fill="#a3e635" />
              </svg>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-lime-400 uppercase tracking-[0.3em] text-xs font-bold mb-5 animate-fade-up">Train hard · Feel unstoppable</div>
          <h1 className="font-extrabold text-5xl sm:text-7xl text-white leading-none mb-6 animate-fade-up-1">YOUR BEST<br /><span className="text-lime-400">SELF AWAITS</span></h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-9 animate-fade-up-2">Group classes, expert coaches and a community that shows up. First class is on us.</p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-up-3">
            <a href="#join" className="bg-lime-400 text-zinc-900 font-bold px-8 py-3.5 rounded-lg hover:bg-lime-300 hover:scale-105 hover:shadow-xl hover:shadow-lime-500/30 transition-all">Start Free Trial</a>
            <a href="#classes" className="border border-zinc-700 text-zinc-200 font-bold px-8 py-3.5 rounded-lg hover:border-lime-400 hover:text-lime-400 hover:scale-105 transition-all">View Schedule</a>
          </div>
        </div>
      </header>

      {/* Classes */}
      <section id="classes" className="px-6 py-24 max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="text-lime-400 uppercase tracking-widest text-xs font-bold mb-3">The Classes</div>
          <h2 className="font-extrabold text-4xl text-white">Find your session</h2>
        </div>
        <div className="space-y-4">
          {classes.map(c => (
            <div key={c.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 hover:border-lime-500/50 hover:bg-zinc-900 hover:translate-x-1 transition-all">
              <div>
                <div className="font-bold text-xl text-white">{c.name}</div>
                <div className="text-sm text-zinc-400">{c.time}</div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-lime-400/15 text-lime-300 px-3 py-1.5 rounded-full">{c.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24" style={{ background: '#11160e' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-lime-400 uppercase tracking-widest text-xs font-bold mb-3">Membership</div>
            <h2 className="font-extrabold text-4xl text-white">Simple pricing</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.name} className={`rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1.5 ${p.hot ? 'border-lime-400 bg-lime-400/5 hover:shadow-2xl hover:shadow-lime-500/20 sm:scale-105' : 'border-zinc-800 bg-zinc-900/40 hover:border-lime-500/40'}`}>
                {p.hot && <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-2">Most popular</div>}
                <div className="font-bold text-xl text-white mb-1">{p.name}</div>
                <div className="mb-5"><span className="font-extrabold text-4xl text-white">{p.price}</span><span className="text-zinc-500">{p.per}</span></div>
                <ul className="space-y-2 mb-6">
                  {p.feats.map(f => <li key={f} className="flex items-center gap-2 text-sm text-zinc-300"><span className="text-lime-400">✓</span>{f}</li>)}
                </ul>
                <a href="#join" className={`block text-center font-bold py-3 rounded-lg transition-colors ${p.hot ? 'bg-lime-400 text-zinc-900 hover:bg-lime-300' : 'border border-zinc-700 text-zinc-200 hover:border-lime-400'}`}>Choose {p.name}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section id="trainers" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-lime-400 uppercase tracking-widest text-xs font-bold mb-3">The Coaches</div>
          <h2 className="font-extrabold text-4xl text-white">Trained to push you</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: 'Marcus', s: 'Strength', img: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&h=800&fit=crop&q=80' },
            { n: 'Aisha', s: 'HIIT & Cardio', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=800&fit=crop&q=80' },
            { n: 'Leo', s: 'Mobility', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=800&fit=crop&q=80' },
            { n: 'Nina', s: 'Spin', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop&q=80' },
          ].map((t, i) => (
            <div key={t.n} className="text-center group">
              <div className="aspect-[3/4] rounded-2xl mb-3 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-lime-500/20" style={{ background: `url('${t.img}') center/cover no-repeat, linear-gradient(160deg, ${['#65a30d', '#4d7c0f', '#3f6212', '#365314'][i]} 0%, #0b0f0a 130%)` }} />
              <div className="font-bold text-white">{t.n}</div>
              <div className="text-xs text-lime-400 uppercase tracking-wider">{t.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Join */}
      <section id="join" className="relative px-6 py-24 text-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #1a2410 0%, #0b0f0a 70%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full blur-3xl animate-orb-pulse" style={{ background: 'rgba(132,204,22,0.18)' }} />
        </div>
        <div className="relative z-10">
          <h2 className="font-extrabold text-4xl sm:text-5xl text-white mb-4">Your first class is free</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">Drop in, meet the crew, and see why PulseFit feels different.</p>
          <a href="#" className="inline-block bg-lime-400 text-zinc-900 font-bold px-10 py-4 rounded-lg hover:bg-lime-300 hover:scale-105 hover:shadow-xl hover:shadow-lime-500/30 transition-all">Claim Free Trial</a>
          <div className="text-zinc-500 text-sm mt-8">120 Energy Blvd · (555) 345-6789 · open daily 5am–10pm</div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-zinc-600 text-sm border-t border-zinc-800">
        PulseFit Studio · Demo website by AG Development
      </footer>
    </div>
  )
}
