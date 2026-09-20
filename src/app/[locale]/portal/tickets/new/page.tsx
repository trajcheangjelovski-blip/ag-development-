import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import PortalLayout from '@/components/portal/PortalLayout'
import { NewTicketForm } from '@/components/portal/NewTicketForm'
import { Link } from '@/i18n/navigation'

export default async function NewClientTicket() {
  const locale = await getLocale()
  const t = await getTranslations('portal.ticketNew')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect(`/${locale}/login`)

  return (
    <PortalLayout>
      <div className="p-8">
        <Link href="/portal/tickets" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5">
          {t('back')}
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">{t('title')}</h1>
        <div className="card p-7">
          <NewTicketForm clientId={profile.client_id} cancelHref="/portal/tickets" />
        </div>
      </div>
    </PortalLayout>
  )
}
