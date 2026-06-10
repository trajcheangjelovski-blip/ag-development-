'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner } from '@/components/ui'
import { LEAD_STATUSES } from '@/lib/utils'

function leadType(helpType: string): string {
  if (!helpType) return 'Request'
  if (helpType === 'Free Website Review') return 'Review'
  if (helpType.startsWith('Contact')) return 'Message'
  return 'Order'
}

function emailTemplate(lead: any): { subject: string; message: string } {
  const firstName = (lead.full_name || '').split(' ')[0] || 'there'
  const type = leadType(lead.help_type)

  if (type === 'Review') {
    return {
      subject: `Your free website design — ${lead.business_name}`,
      message: `Hi ${firstName},\n\nThanks for requesting a free website review for ${lead.business_name}!\n\nWe've taken a look at your business details and prepared a custom website design for you. You'll find it attached / linked below.\n\nIf you like what you see, just reply to this email and we'll take it from there — no pressure, no commitment.\n\nBest regards,\nAG Development Team`,
    }
  }
  if (type === 'Message') {
    return {
      subject: `Re: Your message to AG Development`,
      message: `Hi ${firstName},\n\nThanks for reaching out!\n\n[Write your reply here]\n\nIf you have any other questions, just reply to this email.\n\nBest regards,\nAG Development Team`,
    }
  }
  return {
    subject: `Your order with AG Development — ${lead.business_name}`,
    message: `Hi ${firstName},\n\nThank you for your order! We received your request:\n\n${lead.help_type}\n\nHere's what happens next:\n1. We'll review your requirements and confirm the details.\n2. You'll receive your client portal access.\n3. We get to work — and you'll see proof of every task.\n\nIf anything above looks wrong or you'd like to make changes, just reply to this email.\n\nBest regards,\nAG Development Team`,
  }
}

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  Order:   { bg: '#dcfce7', color: '#166534' },
  Review:  { bg: '#dbeafe', color: '#1d4ed8' },
  Message: { bg: '#fef3c7', color: '#92400e' },
  Request: { bg: '#f1f5f9', color: '#475569' },
}

export default function AdminLeadDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Email composer state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/leads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data)
        const tpl = emailTemplate(data)
        setSubject(tpl.subject)
        setMessage(tpl.message)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function update(changes: Record<string, string>) {
    setSaving(true)
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (res.ok) setLead(await res.json())
    setSaving(false)
  }

  async function deleteLead() {
    setDeleting(true)
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/leads')
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      setSendResult({ ok: false, text: data?.error || 'Failed to delete lead' })
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function sendEmail() {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch(`/api/leads/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Email failed to send')
      setLead(data)
      setSendResult({
        ok: true,
        text: data.status === 'Contacted'
          ? 'Email sent — lead moved to Contacted.'
          : 'Email sent.',
      })
    } catch (e) {
      setSendResult({ ok: false, text: e instanceof Error ? e.message : 'Email failed to send' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <PortalLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></PortalLayout>
  if (!lead) return <PortalLayout><div className="p-8 text-slate-500">Lead not found.</div></PortalLayout>

  const type = leadType(lead.help_type)
  const typeStyle = TYPE_STYLES[type]
  const submittedAt = new Date(lead.created_at).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <PortalLayout>
      <div className="p-8">
        <button onClick={() => router.push('/admin/leads')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5">
          ← Back to Leads
        </button>

        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-display text-2xl font-extrabold text-slate-800">{lead.business_name}</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                {type}
              </span>
            </div>
            <p className="text-slate-500 text-sm">{lead.full_name} · {lead.email}</p>
            <p className="text-slate-400 text-xs mt-1">Submitted {submittedAt}</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <Spinner size="sm" />}
            <select
              className="form-input w-auto py-2 text-sm"
              value={lead.status}
              onChange={e => update({ status: e.target.value })}
            >
              {LEAD_STATUSES.map((s: string) => <option key={s}>{s}</option>)}
            </select>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteLead}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: '#dc2626' }}
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: details + message */}
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Lead Details</h3>
              {[
                ['Type', type],
                ['Business', lead.business_name],
                ['Website', lead.website || '—'],
                ['Contact Name', lead.full_name],
                ['Email', lead.email],
                ['Phone', lead.phone || '—'],
                ['Monthly Budget', lead.budget],
                ['Help Needed', lead.help_type],
                ['Status', lead.status],
                ['Submitted', submittedAt],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm gap-4">
                  <span className="text-slate-500 font-medium flex-shrink-0">{l}</span>
                  <span className="text-slate-800 font-semibold text-right break-words min-w-0">{v}</span>
                </div>
              ))}
            </div>

            {lead.message && (
              <div className="card p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Message / Details</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 whitespace-pre-wrap break-words">{lead.message}</p>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Admin Notes</h3>
              <textarea
                className="form-input min-h-28 resize-none mb-3"
                placeholder="Add notes, follow-up dates, proposal details..."
                value={lead.admin_notes || ''}
                onChange={e => setLead({ ...lead, admin_notes: e.target.value })}
                onBlur={() => update({ admin_notes: lead.admin_notes || '' })}
              />
              <p className="text-xs text-slate-400">Notes auto-save when you click outside the field. Sent emails are logged here automatically.</p>
            </div>
          </div>

          {/* Right: email composer */}
          <div className="card p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Send Email</h3>
              <span className="text-xs text-slate-400">From: support@ag-development.dev</span>
            </div>

            {sendResult && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
                style={sendResult.ok
                  ? { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }
                  : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
              >
                {sendResult.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">To</label>
                <input className="form-input bg-slate-50" value={lead.email} readOnly />
              </div>
              <div>
                <label className="form-label">Subject</label>
                <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea
                  className="form-input min-h-64 resize-y"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Pre-filled with a {type.toLowerCase()} template — edit before sending. Replies go to support@ag-development.dev.
                </p>
              </div>
              <button
                onClick={sendEmail}
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-60"
                style={{ background: '#2563eb' }}
              >
                {sending ? <><Spinner size="sm" /> Sending...</> : 'Send Email →'}
              </button>
              {lead.status === 'New' && (
                <p className="text-xs text-slate-400 text-center">
                  Sending will automatically move this lead to <strong>Contacted</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
