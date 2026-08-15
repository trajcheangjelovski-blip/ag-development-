import { defineRouting } from 'next-intl/routing'

// Two locales, English default. `localePrefix: 'always'` means every URL
// carries its locale segment (/en/... or /mk/...), which keeps routing
// unambiguous and makes the geo redirect in middleware simple.
export const routing = defineRouting({
  locales: ['en', 'mk'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export type AppLocale = (typeof routing.locales)[number]

// Locale -> pricing region. Kept separate from locale so we can later decouple
// language from currency if needed (see TRANSLATION_GEO_PLAN.md §1).
export function regionFromLocale(locale: string): 'us' | 'mk' {
  return locale === 'mk' ? 'mk' : 'us'
}
