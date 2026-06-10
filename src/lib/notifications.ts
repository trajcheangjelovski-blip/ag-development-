import { createAdminClient } from '@/lib/supabase/server'

type NotificationType = 'info' | 'success' | 'warning' | 'urgent'

export async function createNotification({
  userId,
  title,
  body,
  link,
  type = 'info',
}: {
  userId: string
  title: string
  body?: string
  link?: string
  type?: NotificationType
}) {
  try {
    const supabase = await createAdminClient()
    await supabase.from('notifications').insert({ user_id: userId, title, body, link, type })
  } catch (e) {
    console.error('Notification error:', e)
  }
}

// Notify every admin profile (role = 'admin') at once.
export async function notifyAdmin({
  title,
  body,
  link,
  type = 'info',
}: {
  title: string
  body?: string
  link?: string
  type?: NotificationType
}) {
  try {
    const supabase = await createAdminClient()
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (!admins?.length) return
    await supabase.from('notifications').insert(
      admins.map(a => ({ user_id: a.id, title, body, link, type }))
    )
  } catch (e) {
    console.error('Notification error:', e)
  }
}

// Get the profile user_id for a given clients.id (needed to notify the right person).
export async function getClientProfileId(clientId: string): Promise<string | null> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('client_id', clientId)
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}
