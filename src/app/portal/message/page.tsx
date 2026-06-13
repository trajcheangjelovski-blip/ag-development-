import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { MessageForm } from '@/components/portal/MessageForm'
import { MarkMessagesRead } from '@/components/portal/MarkMessagesRead'
import { DeleteMessageButton } from '@/components/portal/DeleteMessageButton'
import { StatusBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

export default async function MessageAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const admin = await createAdminClient()
  const { data: threads } = await admin
    .from('tickets')
    .select('id, title, status, created_at')
    .eq('client_id', profile.client_id)
    .eq('category', 'Message')
    .eq('hidden_for_client', false)
    .order('created_at', { ascending: false })

  return (
    <PortalLayout>
      <MarkMessagesRead link="/portal/message" />
      <div className="p-8">
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-1">Message AG Development</h1>
        <p className="text-slate-500 text-sm mb-6">
          Reach us directly with a question or request. Always available — even if your plan has expired.
        </p>

        <div className="card p-7 mb-6">
          <MessageForm clientId={profile.client_id} />
        </div>

        {!!threads?.length && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-display font-bold text-slate-800 text-sm">Your Messages</h2>
            </div>
            <table className="w-full">
              <tbody>
                {threads.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/portal/message/${t.id}`} className="font-semibold text-sm text-slate-800 hover:text-blue-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap">{formatRelativeTime(t.created_at)}</td>
                    <td className="px-5 py-3.5 text-right w-28 whitespace-nowrap">
                      <Link href={`/portal/message/${t.id}`} className="text-xs text-blue-600 hover:underline font-medium">Open →</Link>
                      <span className="ml-3"><DeleteMessageButton id={t.id} audience="client" /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
