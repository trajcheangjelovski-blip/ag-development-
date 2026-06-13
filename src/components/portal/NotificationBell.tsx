'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_DOT: Record<string, string> = {
  info:    'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  urgent:  'bg-red-500',
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Load + Realtime
  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      setNotifications((data as Notification[]) || [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => [payload.new as Notification, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev =>
          prev.map(n => n.id === (payload.new as Notification).id ? payload.new as Notification : n)
        )
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unread = notifications.filter(n => !n.is_read).length

  async function handleClick(n: Notification) {
    setOpen(false)
    if (!n.is_read) {
      const supabase = createClient()
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.link) router.push(n.link)
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="text-sm font-semibold hidden sm:inline">Notifications</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${TYPE_DOT[n.type] || 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
