import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers. Import `Link` from here INSTEAD of
// 'next/link' anywhere inside a localized page/component — it automatically
// prefixes the active locale (so href="/pricing" -> /en/pricing or /mk/pricing).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
