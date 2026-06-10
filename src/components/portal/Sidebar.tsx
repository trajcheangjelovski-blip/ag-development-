'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/admin/tickets', label: 'All Tickets', icon: '🎫' },
  { href: '/admin/clients', label: 'Clients', icon: '👥' },
  { href: '/admin/leads', label: 'Leads & CRM', icon: '📋' },
  { href: '/admin/reports', label: 'Monthly Reports', icon: '📊' },
  { href: '/admin/invoices', label: 'Invoices', icon: '💳' },
  { href: '/admin/activity', label: 'Activity Log', icon: '📜' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const clientLinks = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/portal/tickets', label: 'My Tickets', icon: '🎫' },
  { href: '/portal/usage', label: 'Plan Usage', icon: '📦' },
  { href: '/portal/reports', label: 'Monthly Reports', icon: '📊' },
  { href: '/portal/invoices', label: 'Invoices', icon: '💳' },
  { href: '/portal/activity', label: 'Activity Log', icon: '📜' },
]

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const links = isAdmin ? adminLinks : clientLinks
  const [newLeads, setNewLeads] = useState(0)
  const [unpaidInvoices, setUnpaidInvoices] = useState(0)

  // Live count of new leads for the admin badge
  useEffect(() => {
    if (!isAdmin) return
    const sb = createClient()

    async function loadCount() {
      const { count } = await sb
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'New')
      setNewLeads(count ?? 0)
    }
    loadCount()

    // Realtime refresh on any change to leads, plus a polling fallback
    const channel = sb
      .channel('sidebar-leads-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, loadCount)
      .subscribe()
    const interval = setInterval(loadCount, 60000)

    return () => { sb.removeChannel(channel); clearInterval(interval) }
  }, [isAdmin, pathname])

  // Live count of unpaid invoices for the client badge
  useEffect(() => {
    if (isAdmin || !profile.client_id) return
    const sb = createClient()

    async function loadCount() {
      const { count } = await sb
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .in('status', ['Pending', 'Overdue'])
      setUnpaidInvoices(count ?? 0)
    }
    loadCount()

    const channel = sb
      .channel('sidebar-invoices-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, loadCount)
      .subscribe()
    const interval = setInterval(loadCount, 60000)

    return () => { sb.removeChannel(channel); clearInterval(interval) }
  }, [isAdmin, profile.client_id, pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 flex flex-col z-50" style={{ background: '#0f1f3d' }}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0">
            AG
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white leading-tight">AG Development</div>
            <div className="text-xs text-white/40">{isAdmin ? 'Admin Portal' : 'Client Portal'}</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-0.5">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'sidebar-link',
                (pathname === link.href || pathname.startsWith(link.href + '/')) && 'sidebar-link-active'
              )}
            >
              <span className="text-base leading-none">{link.icon}</span>
              {link.label}
              {link.href === '/admin/leads' && newLeads > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[22px] text-center leading-none flex-shrink-0">
                  +{newLeads > 99 ? '99' : newLeads}
                </span>
              )}
              {link.href === '/portal/invoices' && unpaidInvoices > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[22px] text-center leading-none flex-shrink-0">
                  +{unpaidInvoices > 99 ? '99' : unpaidInvoices}
                </span>
              )}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-white/25 px-3 pt-5 pb-1.5">
              Public Site
            </div>
            <Link href="/" target="_blank" className="sidebar-link">
              <span>🌐</span> View Website
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{profile.full_name}</div>
            <div className="text-xs text-white/40 capitalize">{profile.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-white/70 transition-colors p-1 text-sm"
            title="Sign Out"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  )
}
