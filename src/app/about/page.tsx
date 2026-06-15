// about/page.tsx
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — AG Development | Website Design, WordPress, Shopify & IT Support',
  description: 'AG Development LLC builds modern business websites, WordPress sites and Shopify stores, and provides first-level IT support for small businesses. A registered Wyoming company founded by Trajche Angjelovski.',
}

const WY_SEARCH = 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx'

// What AG Development builds — leads the page so the message is clear in 5 seconds.
const services = [
  {
    icon: '💼',
    title: 'Business Websites',
    text: 'Professional websites for small businesses, service providers, and local companies.',
  },
  {
    icon: '🌐',
    title: 'WordPress Websites',
    text: 'Custom pages, updates, security, backups, and ongoing maintenance.',
  },
  {
    icon: '🛒',
    title: 'Shopify Stores',
    text: 'Online stores, product pages, basic setup, and support.',
  },
  {
    icon: '🛠️',
    title: 'Website Care',
    text: 'Monthly website updates, fixes, backups, and small improvements.',
  },
]

const skillGroups = [
  {
    icon: '💻',
    title: 'Website Design & Development',
    items: ['Business websites', 'WordPress websites', 'Shopify stores', 'Landing pages', 'Mobile-friendly design', 'Ongoing care, backups & updates'],
  },
  {
    icon: '🎧',
    title: 'IT Support',
    items: ['First-level (L1) IT support', 'Remote troubleshooting', 'Password resets & account setup', 'Software install, updates & licensing', 'Email & account configuration', 'Printer & peripheral setup', 'Antivirus & malware removal', 'Ticket handling & escalation'],
  },
  {
    icon: '🖥️',
    title: 'Systems & Endpoints',
    items: ['Windows install & administration', 'Active Directory', 'Microsoft Entra & Configuration Manager', 'Security tokens & endpoint security'],
  },
  {
    icon: '🌐',
    title: 'Networking & Hardware',
    items: ['PC hardware diagnostics & repair', 'Network setup, FTP cabling & troubleshooting', 'CCTV / video surveillance install & service'],
  },
  {
    icon: '🗄️',
    title: 'Data & Cloud',
    items: ['SQL Server Express administration (backup, cleanup, shrink)', 'QNAP NAS setup, maintenance & backup', 'Amazon Web Services management'],
  },
  {
    icon: '🎨',
    title: 'Social Media & Design',
    items: ['Social media posts & stories', 'Banner & ad graphics', 'Brand visuals & logos', 'Monthly content packages', 'Mobile-friendly creative for every platform'],
  },
]

const experience = [
  { role: 'Founder & Lead Engineer', org: 'AG Development LLC', period: 'Nov 2023 – present', note: 'Websites, IT support and digital services for small businesses.' },
  { role: 'Shopify & WordPress Developer (Freelancer)', org: 'Upwork', period: 'Freelance', note: 'Built and customized Shopify stores and WordPress sites for clients worldwide.' },
  { role: 'System Administrator / IT', org: 'MCASH', period: 'Current', note: 'Systems administration and IT operations.' },
  { role: 'System Administrator', org: 'Elena Luka Home', period: '1.5 years', note: 'Systems, networking and on-site support.' },
  { role: 'IT Support', org: 'Zhito Marketi — Veles', period: '2 years', note: 'IT support, POS, printers and store systems.' },
]

const education = [
  { school: 'AUE — Faculty of Informatics', detail: 'Software Engineering (background major)' },
  { school: 'Brainster', detail: 'Full-Stack Developer Academy' },
]

export default function AboutPage() {
  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">About AG Development</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Modern websites and reliable IT support — built by a real, registered LLC.
          </h1>
          <p className="text-white/75 text-base sm:text-lg mb-6">
            AG Development LLC builds modern business websites, WordPress sites, and Shopify stores, keeps them maintained,
            and provides first-level IT support for small businesses. Real company, real person, real accountability.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link href="/review" className="bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
              Get a Free Website Review
            </Link>
            <Link href="/contact" className="border border-white/30 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
              Start Your Website Project →
            </Link>
          </div>
          <span className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-sm font-semibold px-3 py-1.5 rounded-full">
            ✓ Verified Wyoming LLC · Filing #2023-001366608
          </span>
        </div>
      </section>

      {/* Websites I build — leads with the core service */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">What I build</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-4">Websites I build</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-8">
            I help small businesses get online with clean, modern, mobile-friendly websites that explain their services
            clearly and make it easy for customers to contact them. Whether a business needs a simple website, a landing
            page, a WordPress site, or a Shopify store, AG Development can design, build, and maintain it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(s => (
              <div key={s.title} className="card p-6">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="font-display font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <Link href="/review" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 mt-8">
            Get a free review of your current website →
          </Link>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Meet the founder</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-1">Trajche Angjelovski</h2>
          <p className="text-slate-500 font-medium mb-5">Founder &amp; Lead Engineer · Website Developer · System Administrator</p>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              I started AG Development to help small businesses get online with websites that actually work for them —
              clear, modern sites that bring in customers — and to back that up with the IT support needed to keep
              everything running smoothly.
            </p>
            <p>
              Strong communication is a big part of how I work: I explain goals and plans in plain language, and I'm
              flexible and reliable from the first conversation to long after a site goes live. Whether it's building a
              website, maintaining one, or solving a tricky support issue, my aim is the same — do it properly, and keep
              it running.
            </p>
          </div>
        </div>
      </section>

      {/* Legitimacy / Verified */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Legitimacy</div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-5">A real, registered business</h2>
          <div className="card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ['Legal name', 'AG Development LLC'],
                ['Entity type', 'Limited Liability Company (LLC)'],
                ['Jurisdiction', 'State of Wyoming, USA'],
                ['Formed', 'November 27, 2023'],
                ['State filing #', '2023-001366608'],
                ['Status', 'Active · Certificate of Organization issued'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{k}</div>
                  <div className="font-semibold text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <a href={WY_SEARCH} target="_blank" rel="noreferrer" className="btn-secondary text-sm px-4 py-2.5">
                Verify on Wyoming Secretary of State →
              </a>
              <span className="text-xs text-slate-500">Search “AG Development LLC” or filing #2023-001366608 — don't take our word for it.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">What I do</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-8">Skills &amp; expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillGroups.map(g => (
              <div key={g.title} className="card p-6">
                <div className="text-2xl mb-3">{g.icon}</div>
                <h3 className="font-display font-bold text-slate-800 mb-3">{g.title}</h3>
                <ul className="space-y-2">
                  {g.items.map(it => (
                    <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Experience</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 mb-8">Where I've worked</h2>
          <div className="space-y-4">
            {experience.map(e => (
              <div key={e.role + e.org} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="font-display font-bold text-slate-800">{e.role}</div>
                  <div className="text-sm text-slate-500">{e.org} — {e.note}</div>
                </div>
                <div className="text-xs font-semibold text-blue-600 whitespace-nowrap">{e.period}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Education</div>
          <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-6">Training &amp; education</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {education.map(ed => (
              <div key={ed.school} className="card p-5">
                <div className="font-display font-bold text-slate-800">{ed.school}</div>
                <div className="text-sm text-slate-500 mt-1">{ed.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-extrabold text-white mb-4">Let's build your website</h2>
          <p className="text-white/70 mb-7">
            Need a new website, ongoing care, or IT support you can count on? Start with a free review — no obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/review" className="bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
              Get a Free Website Review
            </Link>
            <Link href="/contact" className="border border-white/30 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
              Start Your Website Project →
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
