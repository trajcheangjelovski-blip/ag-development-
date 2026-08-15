import createMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

function localeInPath(pathname: string): string | null {
  const seg = pathname.split('/')[1]
  return (routing.locales as readonly string[]).includes(seg) ? seg : null
}

// Reads the visitor's country (ISO code, e.g. "MK") from whatever geo source
// is in front of the app. Returns '' when no source is configured.
//  - Cloudflare:        CF-IPCountry
//  - Vercel:            x-vercel-ip-country
//  - Generic/nginx:     x-country / x-geo-country (if you set it from MaxMind)
function countryFromRequest(request: NextRequest): string {
  const h = request.headers
  const raw =
    h.get('cf-ipcountry') ||
    h.get('x-vercel-ip-country') ||
    h.get('x-country') ||
    h.get('x-geo-country') ||
    ''
  return raw.toUpperCase()
}

// Attaches a Supabase server client to a response and refreshes the session.
// Returns the user (or null) plus the supabase client for further role checks.
function supabaseFor(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )
  return supabase
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) API routes: no locale handling, but keep refreshing the auth session
  //    so tokens don't expire mid-session (preserves the old behavior).
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next({ request })
    const supabase = supabaseFor(request, response)
    await supabase.auth.getUser()
    return response
  }

  const current = localeInPath(pathname)

  // 2) Geo soft-redirect: a locale-less path with no explicit choice gets
  //    sent to the country's locale. MK -> /mk, everyone else -> /en.
  //    A NEXT_LOCALE cookie (set by a previous visit) always wins.
  if (!current && !request.cookies.has('NEXT_LOCALE')) {
    const country = countryFromRequest(request)
    const locale = country === 'MK' ? 'mk' : routing.defaultLocale
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
    const res = NextResponse.redirect(url)
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    return res
  }

  // 3) Locale routing (cookie/prefix aware). This is the base response.
  const response = intlMiddleware(request)

  // 4) Auth gating — only for localized app areas. Strip the locale prefix
  //    to test the underlying route.
  const locale = current ?? routing.defaultLocale
  const rest = current ? pathname.slice(locale.length + 1) || '/' : pathname

  const isAdmin = rest === '/admin' || rest.startsWith('/admin/')
  const isPortal = rest === '/portal' || rest.startsWith('/portal/')
  const isLogin = rest === '/login'

  if (!isAdmin && !isPortal && !isLogin) return response

  const supabase = supabaseFor(request, response)
  const { data: { user } } = await supabase.auth.getUser()

  if (isAdmin) {
    if (!user) return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.redirect(new URL(`/${locale}/portal`, request.url))
  }

  if (isPortal) {
    if (!user) return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (isLogin && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const dest = profile?.role === 'admin' ? `/${locale}/admin/dashboard` : `/${locale}/portal/dashboard`
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  // Run on everything except Next internals and static files (with a dot).
  // /api IS matched so the session-refresh branch above can run.
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
