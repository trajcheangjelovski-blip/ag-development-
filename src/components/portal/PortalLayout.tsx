'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/portal/Sidebar'
import { NotificationBell } from '@/components/portal/NotificationBell'
import type { Profile } from '@/types'

export default function PortalLayout({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: 'admin' | 'client'
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data) { router.push('/login'); return }
      if (requiredRole && data.role !== requiredRole) {
        router.push(data.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard')
        return
      }
      setProfile(data)
    }
    load()
  }, [router, requiredRole])

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar profile={profile} />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-start gap-2 px-6 h-14 bg-white/80 backdrop-blur border-b border-slate-200">
          <NotificationBell userId={profile.id} />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
