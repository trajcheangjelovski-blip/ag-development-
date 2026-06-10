import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import TicketDetailClient from '@/components/portal/TicketDetailClient'

export default async function AdminTicketDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, client:clients(*, package:support_packages(*)), creator:profiles!created_by(id, full_name, role)')
    .eq('id', params.id)
    .single()

  if (!ticket) notFound()

  return (
    <PortalLayout requiredRole="admin">
      <TicketDetailClient ticketId={params.id} initialTicket={ticket} profile={profile} />
    </PortalLayout>
  )
}
