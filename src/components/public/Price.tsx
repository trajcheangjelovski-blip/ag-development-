'use client'
import { useLocale } from 'next-intl'
import { formatPrice } from '@/lib/money'

// Renders a price in the active locale's display currency (MK → denars, else USD).
// Reads the locale itself, so it works in any component scope without prop drilling.
// NOTE: MK prices are shown in denars but charged in EUR at Stripe (see lib/money.ts).
export function Price({ amount }: { amount: number }) {
  const locale = useLocale()
  return <>{formatPrice(amount, locale === 'mk' ? 'MKD' : 'USD', locale)}</>
}
