// demos/dental/page.tsx — standalone demo website (frontend only)
import { DemoBanner } from '@/components/demos/DemoBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BrightSmile Dental — Family Dentistry (Demo)',
  description: 'Demo dental clinic website built by AG Development.',
}

const services = [
  { icon: '🦷', title: 'General Dentistry', desc: 'Checkups, cleanings, fillings and preventive care for the whole family.' },
  { icon: '✨', title: 'Cosmetic Dentistry', desc: 'Whitening, veneers and smile makeovers tailored to you.' },
  { icon: '🪥', title: 'Hygiene & Prevention', desc: 'Deep cleaning and personalized plans to keep gums healthy.' },
  { icon: '🔧', title: 'Restorative Care', desc: 'Crowns, bridges and implants that look and feel natural.' },
  { icon: '😬', title: 'Orthodontics', desc: 'Clear aligners and braces for straighter, confident smiles.' },
  { icon: '🚑', title: 'Emergency Care', desc: 'Same-day appointments when you need urgent relief.' },
]

const team = [
  { name: 'Dr. Sarah Mitchell', role: 'Lead Dentist · DDS', c: '#0ea5e9', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&h=600&fit=crop&q=80' },
  { name: 'Dr. James Okafor', role: 'Orthodontist', c: '#14b8a6', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&h=600&fit=crop&q=80' },
  { name: 'Emily Chen', role: 'Dental Hygienist', c: '#6366f1', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&q=80' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-xl shadow-lg shadow-sky-500/30" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2.5c-2 0-3 1-4.5 1S5 2.8 4 4.2C2.8 5.8 3.2 8 4 11c.6 2.2.8 4 1.3 6.5.3 1.6.7 3 1.4 3s.9-1.4 1.2-3c.3-1.7.5-3 1.1-3h.1c.6 0 .8 1.3 1.1 3 .3 1.6.5 3 1.2 3s1.1-1.4 1.4-3c.5-2.5.7-4.3 1.3-6.5.8-3 1.2-5.2 0-6.8-1-1.4-2-1.7-3.5-1.7s-2.5 1-4.5 1z" />
        </svg>
      </span>
      <span className="font-bold text-xl text-sky-600">BrightSmile</span>
    </div>
  )
}

export default function DentalDemo() {
  const navLinks = [['Services', '#services'], ['Why Us', '#why'], ['Team', '#team'], ['Contact', '#book']]
  return (
    <div className="min-h-screen bg-white text-slate-700 font-sans">
      <DemoBanner />

      {/* Nav */}
      <nav className="sticky top-[37px] z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <input type="checkbox" id="nav-dental" className="peer hidden" />
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="hover:text-sky-600 transition-colors">{l}</a>)}
          </div>
          <a href="#book" className="hidden md:inline-block bg-sky-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-sky-700 hover:scale-105 transition-all">Book Online</a>
          <label htmlFor="nav-dental" className="md:hidden cursor-pointer text-2xl text-sky-600 select-none">☰</label>
          <div className="absolute top-16 inset-x-0 hidden peer-checked:flex md:peer-checked:hidden flex-col gap-1 bg-white border-y border-slate-100 p-4 shadow-lg animate-fade-up">
            {navLinks.map(([l, h]) => <a key={h} href={h} className="py-2 text-slate-700 hover:text-sky-600 transition-colors">{l}</a>)}
            <a href="#book" className="mt-2 text-center bg-sky-600 text-white font-bold px-5 py-2.5 rounded-lg">Book Online</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative px-6 py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 right-10 w-80 h-80 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(56,189,248,0.35)' }} />
          <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full blur-3xl animate-orb-pulse" style={{ background: 'rgba(45,212,191,0.3)' }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1 rounded-full mb-5 animate-fade-up">Accepting new patients</div>
            <h1 className="font-bold text-4xl sm:text-5xl text-slate-900 leading-tight mb-5 animate-fade-up-1">Healthy smiles for the whole family</h1>
            <p className="text-lg text-slate-600 mb-8 animate-fade-up-2">Gentle, modern dental care in a calm, welcoming clinic. Same-day appointments and transparent pricing — no surprises.</p>
            <div className="flex flex-wrap gap-4 animate-fade-up-3">
              <a href="#book" className="bg-sky-600 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-sky-700 hover:scale-105 hover:shadow-xl hover:shadow-sky-500/30 transition-all">Book an Appointment</a>
              <a href="#services" className="border border-slate-300 text-slate-700 font-bold px-7 py-3.5 rounded-lg hover:border-sky-400 hover:scale-105 transition-all">Our Services</a>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-3xl shadow-2xl shadow-sky-500/20 animate-float-slow" style={{ background: "url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1000&h=750&fit=crop&q=80') center/cover no-repeat, linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%)" }} />
        </div>
      </header>

      {/* Services */}
      <section id="services" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-sky-600 uppercase tracking-widest text-xs font-bold mb-3">What We Offer</div>
          <h2 className="font-bold text-4xl text-slate-900">Complete dental care</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.title} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm card-hover">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us / stats */}
      <section id="why" className="relative px-6 py-20 overflow-hidden" style={{ background: '#0c4a6e' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(56,189,248,0.25)' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[['25+', 'Years of care'], ['12k+', 'Happy patients'], ['4.9★', 'Average rating'], ['Same', 'Day emergencies']].map(([n, l]) => (
            <div key={l}>
              <div className="font-bold text-4xl text-sky-300 mb-1">{n}</div>
              <div className="text-sm text-sky-100/80">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-sky-600 uppercase tracking-widest text-xs font-bold mb-3">Meet the Team</div>
          <h2 className="font-bold text-4xl text-slate-900">Caring professionals</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {team.map(t => (
            <div key={t.name} className="text-center group">
              <div className="aspect-square rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl" style={{ background: `url('${t.img}') center/cover no-repeat, linear-gradient(135deg, ${t.c} 0%, #0c4a6e 130%)` }} />
              <div className="font-bold text-lg text-slate-900">{t.name}</div>
              <div className="text-sm text-sky-600">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Book */}
      <section id="book" className="px-6 py-24" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-bold text-4xl text-slate-900 mb-4">Ready to book your visit?</h2>
          <p className="text-slate-600 mb-8">Call us or request an appointment online — we'll confirm within one business day.</p>
          <div className="grid sm:grid-cols-3 gap-6 text-slate-700 mb-10">
            <div><div className="font-bold text-sky-600 mb-1">Phone</div>(555) 234-5678</div>
            <div><div className="font-bold text-sky-600 mb-1">Hours</div>Mon–Fri · 8am–6pm</div>
            <div><div className="font-bold text-sky-600 mb-1">Location</div>200 Wellness Ave</div>
          </div>
          <a href="#" className="inline-block bg-sky-600 text-white font-bold px-9 py-3.5 rounded-lg hover:bg-sky-700 hover:scale-105 hover:shadow-xl hover:shadow-sky-500/30 transition-all">Request Appointment</a>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        BrightSmile Dental · Demo website by AG Development
      </footer>
    </div>
  )
}
