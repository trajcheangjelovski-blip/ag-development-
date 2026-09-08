import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

// /portal has no page of its own — send visitors to the dashboard.
// (Middleware already gates auth: unauthenticated → /login.)
export default async function PortalIndex() {
  const locale = await getLocale()
  redirect(`/${locale}/portal/dashboard`)
}
