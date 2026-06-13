import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import TicketDetailClient from '@/components/portal/TicketDetailClient'

export default async function ClientMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.client_id) redirect('/login')

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, client:clients(*, package:support_packages(*)), creator:profiles!created_by(id, full_name, role)')
    .eq('id', id)
    .eq('client_id', profile.client_id)
    .eq('hidden_for_client', false)
    .single()

  if (!ticket) notFound()

  return (
    <PortalLayout>
      <TicketDetailClient ticketId={id} initialTicket={ticket} profile={profile} />
    </PortalLayout>
  )
}
