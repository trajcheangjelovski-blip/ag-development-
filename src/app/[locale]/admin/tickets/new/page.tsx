import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { NewTicketForm } from '@/components/portal/NewTicketForm'
import Link from 'next/link'

export default async function AdminNewTicket() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/portal/tickets/new')

  const { data: clients } = await supabase.from('clients').select('id, business_name').eq('is_active', true).order('business_name')

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <Link href="/admin/tickets" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5">
          ← Back to Tickets
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-6">New Ticket</h1>
        <div className="card p-7">
          <NewTicketForm clientId="" clients={clients || []} isAdmin cancelHref="/admin/tickets" />
        </div>
      </div>
    </PortalLayout>
  )
}
