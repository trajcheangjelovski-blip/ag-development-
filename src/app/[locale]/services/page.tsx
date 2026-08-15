import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Website development, maintenance, IT support, graphic design, social media content, email setup, domain & DNS — remote services for small businesses.',
  keywords: ['website maintenance', 'IT support', 'social media design', 'email setup', 'domain DNS', 'graphic design small business'],
  openGraph: {
    title: 'Services — AG Development',
    description: 'Website development, IT support, design, and digital growth services for small businesses.',
    url: 'https://ag-development.dev/services',
  },
  alternates: { canonical: 'https://ag-development.dev/services' },
}

const categories = [
  {
    id: 'web',
    label: 'Website Services',
    headline: 'Build & Maintain Your Online Presence',
    icon: '🌐',
    accent: 'blue',
    services: [
      {
        icon: '🌐', title: 'Website Development',
        desc: 'Custom WordPress & Shopify websites built to attract customers. Mobile-first, fast, SEO-ready. From simple 5-page business sites to full e-commerce stores.',
        price: '$800–$3,500+',
      },
      {
        icon: '📝', title: 'Website Maintenance',
        desc: 'Monthly core and plugin updates, backups, security scans, speed optimization, and content changes. Keep your site secure and running.',
        price: 'From $29/mo',
      },
      {
        icon: '📄', title: 'Landing Page Development',
        desc: 'High-converting landing pages for ads, lead gen, promos, and events. Form integration, analytics setup, and tracking pixel configuration.',
        price: '$400–$1,200+',
      },
    ],
  },
  {
    id: 'design',
    label: 'Graphic Design & Social Media',
    headline: 'Design That Gets Your Brand Noticed',
    icon: '🎨',
    accent: 'violet',
    services: [
      {
        icon: '🎨', title: 'Graphic Design',
        desc: 'Logos, banners, flyers, event posters, business cards, and brand materials. Professional design that makes your business look credible and consistent.',
        price: 'From $29/mo',
      },
      {
        icon: '📱', title: 'Social Media Content',
        desc: 'Posts, stories, reels, and banners designed for your brand — sized for Facebook, Instagram, TikTok, and more. Promotions, announcements, and seasonal content.',
        price: 'From $29/mo',
      },
      {
        icon: '🖼️', title: 'Website Banners & Graphics',
        desc: 'Homepage banners, hero images, promo graphics, and product visuals. Designed to match your website brand and drive conversions.',
        price: '$20–$30 each',
      },
    ],
  },
  {
    id: 'infra',
    label: 'Domain, Email & DNS',
    headline: 'The Foundation Every Business Needs',
    icon: '🌍',
    accent: 'emerald',
    services: [
      {
        icon: '🌍', title: 'Domain & DNS Management',
        desc: 'Domain registration, DNS records (A, MX, CNAME, TXT), subdomains, SSL setup, redirects, and nameserver transfers. We handle the technical details.',
        price: 'Included in plans',
      },
      {
        icon: '📧', title: 'Business Email Setup',
        desc: 'Set up professional email with Google Workspace or Microsoft 365. Configure SPF, DKIM, DMARC, and make sure email actually lands in inboxes.',
        price: 'Included in plans',
      },
    ],
  },
  {
    id: 'it',
    label: 'L1 IT Support',
    headline: 'Tech Help for You & Your Team',
    icon: '🛡️',
    accent: 'red',
    services: [
      {
        icon: '🛡️', title: 'Monthly L1 IT Support',
        desc: 'First-level tech support for your team. Password resets, software help, printer issues, browser problems, basic connectivity, and escalation guidance.',
        price: 'From $49/mo',
      },
      {
        icon: '💻', title: 'Remote Support & Troubleshooting',
        desc: 'We connect remotely to diagnose and fix common issues. Browser crashes, slow computers, email configuration, software installs, and more.',
        price: 'Included in IT plans',
      },
    ],
  },
  {
    id: 'custom',
    label: 'Custom Platforms',
    headline: 'Built Specifically for Your Business',
    icon: '⚡',
    accent: 'orange',
    services: [
      {
        icon: '⚡', title: 'Custom Web Applications',
        desc: 'Client portals, dashboards, booking systems, CRM tools, and internal business tools built to your exact workflow. We scope, build, and maintain.',
        price: 'Quoted on request',
      },
      {
        icon: '🔧', title: 'Platform Maintenance',
        desc: 'Ongoing maintenance, bug fixes, feature updates, and performance monitoring for your custom platforms and web applications.',
        price: 'Included in plans',
      },
    ],
  },
]

const accentColors: Record<string, { bg: string; text: string; border: string; badge: string; iconBg: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   iconBg: 'bg-blue-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', iconBg: 'bg-violet-100' },
  emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',iconBg: 'bg-emerald-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    iconBg: 'bg-red-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', iconBg: 'bg-orange-100' },
}

export default function ServicesPage() {
  return (
    <>
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white py-20 px-6 grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 60%, #162b52 100%)' }}
      >
        <div
          className="absolute -top-20 right-0 w-[500px] h-[400px] pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 animate-fade-up">What We Do</div>
          <h1 className="font-display text-5xl lg:text-6xl font-extrabold text-white mb-5 animate-fade-up-1 leading-tight">
            Services That Keep Your<br />
            <span className="gradient-text">Business Online</span>
          </h1>
          <p className="text-white/60 text-lg lg:text-xl leading-relaxed max-w-2xl animate-fade-up-2">
            We handle the tech. You run the business. Every service is remote, reliable, and built for small business owners with no in-house IT staff.
          </p>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ───────────────────────────────────────────── */}
      {categories.map((cat, catIdx) => {
        const colors = accentColors[cat.accent]
        return (
          <section key={cat.id} className={`py-20 px-6 ${catIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
            <div className="max-w-6xl mx-auto">
              {/* Category header */}
              <div className="flex items-center gap-4 mb-12">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.iconBg}`}>
                  {cat.icon}
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${colors.text}`}>{cat.label}</div>
                  <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-800">{cat.headline}</h2>
                </div>
              </div>

              {/* Service cards */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cat.services.length === 2 ? '2' : '3'} gap-5`}>
                {cat.services.map(s => (
                  <div
                    key={s.title}
                    className={`card-hover bg-white border-2 ${colors.border} rounded-2xl p-6 cursor-default`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${colors.iconBg}`}>
                      {s.icon}
                    </div>
                    <h3 className="font-display font-bold text-slate-800 mb-2 text-lg">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{s.desc}</p>
                    <div className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}>
                      {s.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 text-center relative overflow-hidden grain"
        style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0f1f3d 60%, #162b52 100%)' }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-4">Not Sure What You Need?</h2>
          <p className="text-white/55 text-lg mb-9">Start with a free demo for your business — no pressure, no commitment.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/review" className="btn-shimmer btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white">
              See a Demo of Your Website for Your Business →
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  )
}
