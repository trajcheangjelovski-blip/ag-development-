// Phone-number normalization for Macedonian (and general) numbers.
// Infobip expects E.164 in international format; we store the digits WITHOUT the
// leading '+' (e.g. "38970123456"), which is what the Viber API accepts as `to`.
//
// Macedonian mobile numbers: national form is 0 + 8 digits starting with 7
// (070/071/072/075/076/077/078…). International: 389 + those 8 digits.

const MK_CC = '389'

// Turn any messy input into E.164 digits (no '+'), or null if it doesn't look
// like a valid phone number. Accepts: 070123456, +389 70 123 456, 38970123456,
// 0038970123456, 70123456.
export function normalizePhone(raw: string, defaultCountry: string = MK_CC): string | null {
  if (!raw) return null
  let s = String(raw).trim()

  const hadPlus = s.startsWith('+')
  // Keep digits only.
  s = s.replace(/[^\d]/g, '')
  if (!s) return null

  // 00 international prefix → drop it (treat as '+').
  if (!hadPlus && s.startsWith('00')) s = s.slice(2)

  if (hadPlus) {
    // Already international (user typed +...). Just return the digits.
    return s.length >= 8 && s.length <= 15 ? s : null
  }

  // Starts with the country code already (e.g. 38970...).
  if (s.startsWith(defaultCountry)) {
    return s.length >= 11 && s.length <= 15 ? s : null
  }

  // National form with trunk 0 (e.g. 070123456) → country code + rest.
  if (s.startsWith('0')) {
    const national = s.slice(1)
    if (national.length < 6 || national.length > 12) return null
    return defaultCountry + national
  }

  // Bare national significant number (e.g. 70123456, 8 digits) → prepend CC.
  if (s.length >= 6 && s.length <= 12) return defaultCountry + s

  return null
}

// Pretty display form, e.g. "38970123456" → "+389 70 123 456" (best-effort).
export function displayPhone(e164: string): string {
  if (!e164) return ''
  if (e164.startsWith(MK_CC) && e164.length === 11) {
    const n = e164.slice(3) // 8 digits
    return `+${MK_CC} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`
  }
  return '+' + e164
}
