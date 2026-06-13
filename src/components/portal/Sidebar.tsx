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
  { href: '/admin/messages', label: 'Messages', icon: '✉️' },
  { href: '/admin/clients', label: 'Clients', icon: '👥' },
  { href: '/admin/leads', label: 'Leads & CRM', icon: '📋' },
  { href: '/admin/reports', label: 'Monthly Reports', icon: '📊' },
  { href: '/admin/stats', label: 'Statistics', icon: '📈' },
  { href: '/admin/invoices', label: 'Invoices', icon: '💳' },
  { href: '/admin/plans', label: 'Plans & Coupons', icon: '🏷️' },
  { href: '/admin/activity', label: 'Activity Log', icon: '📜' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/portal/settings', label: 'My Account', icon: '🔐' },
]

const clientLinks = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/portal/tickets', label: 'My Tickets', icon: '🎫' },
  { href: '/portal/message', label: 'Message Us', icon: '✉️' },
  { href: '/portal/usage', label: 'Plan Usage', icon: '📦' },
  { href: '/portal/reports', label: 'Monthly Reports', icon: '📊' },
  { href: '/portal/invoices', label: 'Invoices', icon: '💳' },
  { href: '/portal/activity', label: 'Activity Log', icon: '📜' },
  { href: '/portal/settings', label: 'Account Settings', icon: '🔐' },
]

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const links = isAdmin ? adminLinks : clientLinks
  const [newLeads, setNewLeads] = useState(0)
  const [unpaidInvoices, setUnpaidInvoices] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const messagesPath = isAdmin ? '/admin/messages' : '/portal/message'

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

  // Live count of unread messages for the Messages link badge (both roles)
  useEffect(() => {
    if (!profile.id) return
    const sb = createClient()

    async function loadCount() {
      const { count } = await sb
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
        .eq('link', messagesPath)
      setUnreadMessages(count ?? 0)
    }
    loadCount()

    const channel = sb
      .channel('sidebar-messages-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, loadCount)
      .subscribe()
    const interval = setInterval(loadCount, 60000)

    return () => { sb.removeChannel(channel); clearInterval(interval) }
  }, [profile.id, messagesPath, pathname])

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
              {link.href === messagesPath && unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[22px] text-center leading-none flex-shrink-0">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
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
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{profile.full_name}</div>
            <div className="text-xs text-white/40 capitalize">{profile.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1.5 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all"
          style={{ background: '#dc2626' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#b91c1c' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#dc2626' }}
          title="Sign Out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
