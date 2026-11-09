import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'

// True when the request comes from a logged-in AG Development admin, so their
// own visits to demos / tracked links are not counted as client activity.
export async function isAdminSession(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// Returns the profile when the user may view demos, otherwise null.
export async function demoViewer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, ok: false as const }
  const { data: profile } = await supabase.from('profiles').select('role, admin_role, permissions, full_name, email').eq('id', user.id).single()
  return { user, profile, ok: can(profile as any, 'demos.view') }
}
