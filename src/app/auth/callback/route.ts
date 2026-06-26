import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Completes the Supabase PKCE handshake for email links (password recovery,
// email confirmation). The link lands here with a `code`, which we exchange
// for a session cookie before forwarding the user to `next`.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Missing, invalid, or expired link
  return NextResponse.redirect(`${origin}/forgot-password?error=expired`)
}
