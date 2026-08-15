'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

// Toggles between EN and MK. Uses next-intl's locale-aware router so the
// current path is preserved across the switch, and drops a NEXT_LOCALE cookie
// so the manual choice overrides geo-detection on future visits.
export function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const other = routing.locales.find(l => l !== locale) ?? routing.defaultLocale

  function switchTo(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`
    router.replace(pathname, { locale: next })
  }

  const styles =
    variant === 'dark'
      ? 'border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5'
      : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'

  return (
    <button
      type="button"
      onClick={() => switchTo(other)}
      aria-label={`Switch language to ${other.toUpperCase()}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold border transition-all ${styles}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {other.toUpperCase()}
    </button>
  )
}
