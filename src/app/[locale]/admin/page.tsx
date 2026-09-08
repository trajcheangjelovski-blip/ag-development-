import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

// /admin has no page of its own — send visitors to the dashboard.
// (Middleware already gates auth: unauthenticated → /login, non-admins → /portal.)
export default async function AdminIndex() {
  const locale = await getLocale()
  redirect(`/${locale}/admin/dashboard`)
}
