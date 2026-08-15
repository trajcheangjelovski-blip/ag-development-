// Currency formatting that adapts to the active locale/region.
// MK market shows Macedonian denar (e.g. "1.500 ден"), US shows USD ("$150").

export function currencyForLocale(locale: string): string {
  return locale === 'mk' ? 'MKD' : 'USD'
}

export function formatPrice(amount: number, currency = 'USD', locale = 'en'): string {
  const intlLocale = locale === 'mk' ? 'mk-MK' : 'en-US'
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

// ─── MK payments (Option A: display denars, charge euros) ────────────────────
// Stripe cannot charge Macedonian denar (MKD), so MK orders are charged the EUR
// equivalent. The denar is pegged by the National Bank of North Macedonia at
// ~61.5 MKD = 1 EUR, so a fixed rate is stable. Adjust here if the peg changes.
export const MKD_PER_EUR = 61.5

// The Stripe currency actually charged for a pricing region.
export function chargeCurrencyForRegion(region: string): 'usd' | 'eur' {
  return region === 'mk' ? 'eur' : 'usd'
}

// Convert a denar amount to the euro amount Stripe will charge (2 decimals).
export function eurFromMkd(mkd: number): number {
  return Math.round((mkd / MKD_PER_EUR) * 100) / 100
}

// Minor units (cents) to charge in the region's Stripe currency for a given
// region-priced amount. US: USD dollars → cents. MK: MKD → EUR → cents.
export function chargeMinorUnits(amount: number, region: string): number {
  if (region === 'mk') return Math.round(eurFromMkd(amount) * 100)
  return Math.round(amount * 100)
}
