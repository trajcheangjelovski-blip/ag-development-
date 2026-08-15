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
