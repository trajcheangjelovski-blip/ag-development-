import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Never serve cached data — fixes stale statuses after updates
      global: {
        fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// True service-role client: NO cookies / user session attached.
// IMPORTANT: when built on the cookie-based SSR client, requests are sent with
// the logged-in user's token instead of the service-role key, so RLS silently
// applies (updates match 0 rows but report success). A bare client with the
// service key as Authorization bypasses RLS as intended.
export async function createAdminClient() {
  return createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input: any, init?: any) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
}
