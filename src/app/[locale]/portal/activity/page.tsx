import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import PortalLayout from '@/components/portal/PortalLayout'
import { EmptyState } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

export default async function ClientActivity() {
  const locale = await getLocale()
  const t = await getTranslations('portal.activity')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect(`/${locale}/login`)

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, actor:profiles!actor_id(full_name, role), ticket:tickets(id, title)')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(100)

  const actionColors: Record<string, string> = {
    'Ticket created': 'bg-blue-500',
    'Status changed': 'bg-amber-500',
    'Comment added': 'bg-purple-500',
    'Time entry added': 'bg-green-500',
    'Proof uploaded': 'bg-emerald-500',
    'Ticket completed': 'bg-green-600',
  }

  return (
    <PortalLayout>
      <div className="p-8">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">{t('title')}</h1>
        <div className="card overflow-hidden">
          {!logs?.length ? (
            <EmptyState icon="📜" title={t('noActivityYet')} description={t('noActivityDesc')} />
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((a: any) => (
                <div key={a.id} className="flex gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${actionColors[a.action] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{a.action}</span>
                        {a.detail && <span className="text-sm text-slate-500 ml-2">— {a.detail}</span>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(a.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">
                        {t('by', { name: a.actor
                          ? (a.actor.role === 'admin' ? t('fromAg', { name: a.actor.full_name.split(' ')[0] }) : a.actor.full_name)
                          : 'AG Development' })}
                      </span>
                      {a.ticket && (
                        <Link href={`/portal/tickets/${a.ticket.id}`} className="text-xs text-blue-600 hover:underline truncate">
                          {a.ticket.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
