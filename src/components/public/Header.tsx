'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { LogoMark } from '@/components/public/Logo'
import { CartButton } from '@/components/public/Cart'
import { usePlans } from '@/lib/usePlans'

// ── Services mega-menu data (prices filled live from the plans API) ──────────

function buildServiceColumns(price: (id: string, fallback: number) => number) {
  return [
    {
      icon: '🌐',
      heading: 'Website Services',
      links: [
        { label: 'Website Creation',      href: '/order?package=business-site&step=1',   description: `Build a new website from $${price('starter-site', 150)}` },
        { label: 'Website Maintenance',   href: '/order/website-care',                   description: `Care plans from $${price('basic-care', 29)}/mo — hosting included` },
        { label: 'E-commerce Store',      href: '/order?package=ecommerce-store&step=1', description: 'Shopify & WooCommerce stores' },
        { label: 'Free Website Review',   href: '/review',                               description: 'Get a free audit of your site' },
      ],
    },
    {
      icon: '🖥️',
      heading: 'L1 IT Support',
      links: [
        { label: `Basic Support — $${price('it-basic', 49)}/mo`,   href: '/order/it-support?plan=basic',  description: '3 tickets/mo, up to 2 users' },
        { label: `Team Support — $${price('it-team', 99)}/mo`,     href: '/order/it-support?plan=team',   description: '8 tickets/mo, up to 5 users' },
        { label: `Office Support — $${price('it-office', 179)}/mo`, href: '/order/it-support?plan=office', description: '15 tickets/mo, up to 10 users' },
        { label: 'View All IT Plans',        href: '/pricing#it-support',           description: 'Compare all support plans' },
      ],
    },
    {
      icon: '🎨',
      heading: 'Design & Social Media',
      links: [
        { label: `Social Starter — $${price('social-starter', 29)}/mo`,   href: '/order/social-media?plan=starter',  description: '2 posts/stories per month' },
        { label: `Social Business — $${price('social-business', 59)}/mo`, href: '/order/social-media?plan=business', description: '6 posts + 1 banner per month' },
        { label: `Social Growth — $${price('social-growth', 99)}/mo`,     href: '/order/social-media?plan=growth',   description: '12 posts + 2 banners per month' },
        { label: 'View All Design Plans',  href: '/pricing#social-media',            description: 'Compare all design packages' },
      ],
    },
  ]
}

const OTHER_NAV = [
  { href: '/pricing',   label: 'Pricing' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contact',   label: 'Contact' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function PublicHeader() {
  const pathname = usePathname()
  const [mobileOpen,       setMobileOpen]       = useState(false)
  const [servicesOpen,     setServicesOpen]     = useState(false)
  const [servicesExpanded, setServicesExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Live prices for the mega-menu
  const apiPlans = usePlans()
  const price = (id: string, fallback: number) =>
    apiPlans.find(p => p.id === id)?.effective_price ?? fallback
  const SERVICES_COLUMNS = buildServiceColumns(price)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Close on route change
  useEffect(() => {
    setServicesOpen(false)
    setMobileOpen(false)
    setServicesExpanded(false)
  }, [pathname])

  function closeAll() {
    setServicesOpen(false)
    setMobileOpen(false)
    setServicesExpanded(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="font-display font-bold text-[15px] text-slate-800">AG Development</span>
        </Link>

        {/* ── Desktop nav ──────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">

          {/* Services dropdown trigger + panel */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setServicesOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: servicesOpen ? '#eff6ff' : 'transparent',
                fontSize: 14,
                fontWeight: 500,
                color: servicesOpen ? '#2563eb' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              Services
              <span
                style={{
                  fontSize: 9,
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                  transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: 0.6,
                }}
              >
                ▼
              </span>
            </button>

            {/* Mega dropdown panel — always rendered, toggled via visibility */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                marginTop: 8,
                width: 720,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 0,
                zIndex: 200,
                visibility: servicesOpen ? 'visible' : 'hidden',
                opacity: servicesOpen ? 1 : 0,
                transform: servicesOpen
                  ? 'translateX(-50%) translateY(0px)'
                  : 'translateX(-50%) translateY(-10px)',
                transition: 'opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1), visibility 0.2s',
                pointerEvents: servicesOpen ? 'all' : 'none',
              }}
            >
              {SERVICES_COLUMNS.map((col, ci) => (
                <div
                  key={col.heading}
                  style={{
                    padding: '0 20px',
                    borderRight: ci < SERVICES_COLUMNS.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  {/* Column heading */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{col.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#94a3b8',
                      }}
                    >
                      {col.heading}
                    </span>
                  </div>

                  {/* Links */}
                  {col.links.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={closeAll}
                      style={{
                        display: 'block',
                        padding: '9px 10px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        background: 'transparent',
                        marginBottom: 2,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                      onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d', marginBottom: 2 }}>
                        {link.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                        {link.description}
                      </div>
                    </a>
                  ))}
                </div>
              ))}

              {/* Bottom bar */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Not sure what you need?</span>
                <a
                  href="/review"
                  onClick={closeAll}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: '#0f1f3d',
                    color: 'white',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Get Free Website Review →
                </a>
              </div>
            </div>
          </div>

          {/* Pricing, Portfolio, Contact */}
          {OTHER_NAV.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === l.href
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <CartButton />
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">
            Sign In
          </Link>
          <Link href="/review" className="btn-secondary text-sm px-4 py-2.5">
            Free Website Review
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="md:hidden flex items-center gap-1">
        <CartButton />
        <button className="p-2" onClick={() => setMobileOpen(o => !o)}>
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700 mb-1" />
          <div className="w-5 h-0.5 bg-slate-700" />
        </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4">

          {/* Services accordion trigger */}
          <button
            onClick={() => setServicesExpanded(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              background: servicesExpanded ? '#f8fafc' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: 2,
            }}
          >
            <span>Services</span>
            <span
              style={{
                fontSize: 9,
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: servicesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                opacity: 0.5,
              }}
            >
              ▼
            </span>
          </button>

          {/* Accordion content */}
          {servicesExpanded && (
            <div style={{ paddingLeft: 8, marginBottom: 8 }}>
              {SERVICES_COLUMNS.map(col => (
                <div key={col.heading} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      paddingBottom: 8,
                      marginBottom: 4,
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: '#94a3b8',
                      }}
                    >
                      {col.heading}
                    </span>
                  </div>
                  {col.links.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={closeAll}
                      style={{
                        display: 'block',
                        padding: '8px 10px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        marginBottom: 1,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>
                        {link.label}
                      </span>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {link.description}
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Other links */}
          <div className="space-y-1">
            {OTHER_NAV.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeAll}
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2 mt-2">
            <Link href="/login" className="block text-center px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-lg">
              Sign In
            </Link>
            <Link href="/review" className="block text-center btn-secondary py-2.5" onClick={closeAll}>
              Free Website Review
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
