'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Clears the unread-message badge by marking message notifications read
// for the current user when they open a Messages page.
export function MarkMessagesRead({ link }: { link: string }) {
  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('link', link)
    })()
    return () => { mounted = false }
  }, [link])

  return null
}
