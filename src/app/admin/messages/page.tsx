'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { EmptyState, Alert, Spinner, StatusBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminMessages() {
  const router = useRouter()
  const [threads, setThreads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ client_id: '', subject: '', message: '' })

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: tData } = await supabase
      .from('tickets')
      .select('*, client:clients(id, business_name)')
      .eq('category', 'Message')
      .eq('hidden_for_admin', false)
      .order('created_at', { ascending: false })
    setThreads(tData || [])
    const { data: cData } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('is_active', true)
      .order('business_name')
    setClients(cData || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Mark message notifications read when this inbox is opened, and refresh
  // on any ticket/notification change.
  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function markRead() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('link', '/admin/messages')
    }
    markRead()

    const channel = supabase
      .channel('admin-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => { load(); markRead() })
      .subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [load])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id || !form.subject.trim() || !form.message.trim()) {
      setError('Pick a client and fill in a subject and message.')
      return
    }
    setSending(true)
    setError('')
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'message',
        category: 'Message',
        client_id: form.client_id,
        title: form.subject,
        description: form.message,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to send message')
      setSending(false)
      return
    }
    const ticket = await res.json()
    setSending(false)
    router.push(`/admin/messages/${ticket.id}`)
  }

  async function deleteThread(t: any) {
    if (!confirm(`Remove "${t.title}" from your inbox? ${t.client?.business_name || 'The client'} will still have their copy.`)) return
    setThreads(prev => prev.filter(x => x.id !== t.id)) // optimistic
    const res = await fetch(`/api/tickets/${t.id}`, { method: 'DELETE' })
    if (!res.ok) {
      load() // restore on failure
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to delete message')
    }
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-800">Messages</h1>
            <p className="text-slate-500 text-sm mt-1">Direct conversations with clients — separate from support tickets.</p>
          </div>
          <button onClick={() => setShowCompose(v => !v)} className="btn btn-secondary">
            {showCompose ? 'Cancel' : '✉️ New Message'}
          </button>
        </div>

        {showCompose && (
          <div className="card p-6 mb-6">
            {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
            <form onSubmit={sendMessage} className="max-w-2xl">
              <div className="mb-4">
                <label className="form-label">Client <span className="text-red-500">*</span></label>
                <select
                  className="form-input"
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label">Subject <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="mb-5">
                <label className="form-label">Message <span className="text-red-500">*</span></label>
                <textarea
                  className="form-input min-h-32 resize-y"
                  placeholder="Write your message to the client..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
                {sending ? <><Spinner size="sm" /> Sending...</> : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading messages…</div>
          ) : !threads.length ? (
            <EmptyState icon="✉️" title="No messages yet" description="Start a conversation with a client using “New Message”." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Subject</th>
                    <th className="table-th">Client</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Started</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((t: any) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/messages/${t.id}`)}
                    >
                      <td className="table-td font-semibold text-slate-800 max-w-xs truncate">{t.title}</td>
                      <td className="table-td text-slate-500">{t.client?.business_name}</td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                      <td className="table-td text-slate-400">{formatRelativeTime(t.created_at)}</td>
                      <td className="table-td whitespace-nowrap">
                        <Link
                          href={`/admin/messages/${t.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          Open →
                        </Link>
                        <button
                          onClick={e => { e.stopPropagation(); deleteThread(t) }}
                          className="ml-4 text-xs text-red-600 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
