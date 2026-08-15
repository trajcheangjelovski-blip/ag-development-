'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert, EmptyState } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import RichEditor from '@/components/admin/RichEditor'

const BUCKET = 'email-attachments'
const MAX_TOTAL_BYTES = 20 * 1024 * 1024 // 20 MB across all attachments

type AttachmentMeta = { path: string; filename: string; contentType?: string; size?: number }

type Campaign = {
  id: string
  subject: string
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'canceled'
  scheduled_for: string | null
  sent_at: string | null
  total: number
  sent_count: number
  failed_count: number
  error: string | null
  created_at: string
}

type Template = {
  id: string
  name: string
  subject: string | null
  body: string | null
  is_html: boolean
  attachments: AttachmentMeta[] | null
  scope: 'personal' | 'shared'
  mine: boolean
}

type Banner = { ok: boolean; text: string } | null

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  canceled: 'bg-slate-100 text-slate-500',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function nowLocalInput() {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

function prettySize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Editor returns '<p><br></p>' when empty — treat that as no content.
function htmlIsEmpty(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/ |&nbsp;/g, '').trim() === ''
}

export default function AdminEmails() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')                 // HTML from the rich editor
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState<'now' | 'later'>('now')
  const [scheduledFor, setScheduledFor] = useState('')

  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [showSave, setShowSave] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplScope, setTplScope] = useState<'personal' | 'shared'>('personal')
  const [tplBusy, setTplBusy] = useState(false)

  const recipientCount = recipients.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean).length
  const totalBytes = attachments.reduce((n, a) => n + (a.size || 0), 0)

  async function loadCampaigns() {
    const res = await fetch('/api/emails')
    if (res.ok) {
      const data = await res.json()
      setTableMissing(!!data.tableMissing)
      setCampaigns(data.campaigns || [])
    }
    setLoading(false)
  }

  async function loadTemplates() {
    const res = await fetch('/api/email-templates')
    if (res.ok) {
      const data = await res.json()
      setTemplates(data.templates || [])
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
    loadCampaigns()
    loadTemplates()
    // Auto-refresh the list so a scheduled email flips to the green "sent"
    // badge on its own once the cron delivers it — no manual reload needed.
    const poll = setInterval(loadCampaigns, 20000)
    return () => clearInterval(poll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (!userId) { setBanner({ ok: false, text: 'Still loading your account — try again in a moment.' }); return }

    let running = totalBytes
    setUploading(true)
    setBanner(null)
    try {
      for (const file of files) {
        if (running + file.size > MAX_TOTAL_BYTES) {
          setBanner({ ok: false, text: `Attachments must total under 20 MB. "${file.name}" was skipped.` })
          continue
        }
        const safe = file.name.replace(/[^\w.\-]+/g, '_')
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })
        if (error) {
          setBanner({ ok: false, text: `Upload failed for "${file.name}": ${error.message}. If this mentions a missing bucket, run the migration.` })
          continue
        }
        running += file.size
        setAttachments(prev => [...prev, { path, filename: file.name, contentType: file.type || undefined, size: file.size }])
      }
    } finally {
      setUploading(false)
    }
  }

  async function removeAttachment(idx: number) {
    const a = attachments[idx]
    setAttachments(prev => prev.filter((_, i) => i !== idx))
    // Best-effort cleanup of the stored file.
    if (a?.path) supabase.storage.from(BUCKET).remove([a.path]).catch(() => {})
  }

  function applyTemplate(id: string) {
    const t = templates.find(x => x.id === id)
    if (!t) return
    setSubject(t.subject || '')
    setMessage(t.body || '')
    setAttachments(Array.isArray(t.attachments) ? t.attachments : [])
    setBanner({ ok: true, text: `Loaded template "${t.name}".` })
  }

  async function saveTemplate() {
    if (!tplName.trim()) { setBanner({ ok: false, text: 'Give the template a name.' }); return }
    setTplBusy(true)
    setBanner(null)
    try {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tplName.trim(), subject, body: message, isHtml: true, attachments, scope: tplScope }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not save template')
      setBanner({ ok: true, text: `Template "${tplName.trim()}" saved.` })
      setShowSave(false); setTplName('')
      loadTemplates()
    } catch (e) {
      setBanner({ ok: false, text: e instanceof Error ? e.message : 'Could not save template' })
    } finally {
      setTplBusy(false)
    }
  }

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/email-templates/${id}`, { method: 'DELETE' })
    if (res.ok) loadTemplates()
    else {
      const d = await res.json().catch(() => ({}))
      setBanner({ ok: false, text: d?.error || 'Could not delete template.' })
    }
  }

  async function submit() {
    setBanner(null)
    if (!recipients.trim() || !subject.trim() || htmlIsEmpty(message)) {
      setBanner({ ok: false, text: 'Recipients, subject, and message are all required.' })
      return
    }
    if (mode === 'later' && !scheduledFor) {
      setBanner({ ok: false, text: 'Pick a date and time to schedule the send.' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          html: message,
          attachments,
          recipients,
          // Convert the picker's local time to a proper UTC ISO string in the
          // browser (which knows the user's timezone) so the server stores the
          // exact instant the admin intended, regardless of the server's zone.
          scheduledFor: mode === 'later' && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send')

      const rejected = (data.recipientsRejected || []) as string[]
      const rejNote = rejected.length ? ` Skipped invalid: ${rejected.join(', ')}.` : ''
      if (data.scheduled) {
        setBanner({ ok: true, text: `Scheduled for ${fmt(data.campaign.scheduled_for)} to ${data.recipientsAccepted} recipient(s).${rejNote}` })
      } else {
        const reason = data.error ? ` Reason: ${data.error}` : ''
        const failNote = data.failed ? ` ${data.failed} failed.${reason}` : ''
        setBanner({ ok: data.failed === 0, text: `Sent to ${data.sent} of ${data.total} recipient(s).${failNote}${rejNote}` })
      }
      setRecipients(''); setSubject(''); setMessage(''); setAttachments([]); setScheduledFor(''); setMode('now')
      loadCampaigns()
    } catch (e) {
      setBanner({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' })
    } finally {
      setSending(false)
    }
  }

  async function cancel(id: string) {
    const res = await fetch(`/api/emails/${id}`, { method: 'PATCH' })
    if (res.ok) loadCampaigns()
    else { const d = await res.json().catch(() => ({})); setBanner({ ok: false, text: d?.error || 'Could not cancel.' }) }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' })
    if (res.ok) loadCampaigns()
    else { const d = await res.json().catch(() => ({})); setBanner({ ok: false, text: d?.error || 'Could not delete.' }) }
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-xl font-extrabold text-slate-800 mb-1">Email</h1>
        <p className="text-sm text-slate-500 mb-6">Send or schedule an email to one recipient or a whole list.</p>

        {tableMissing && (
          <div className="mb-6">
            <Alert type="warning" message="The email_campaigns table is missing. Run supabase/pending-migrations.sql in your Supabase SQL editor to enable this feature." />
          </div>
        )}

        <div className="card p-6 mb-8">
          {banner && <div className="mb-4"><Alert type={banner.ok ? 'success' : 'error'} message={banner.text} /></div>}

          {/* Templates */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = '' }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Load a template…</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.scope === 'shared' ? ' (shared)' : ''}</option>
              ))}
            </select>
            <button onClick={() => setShowSave(s => !s)} className="text-xs font-semibold text-blue-600 hover:underline">
              {showSave ? 'Cancel' : 'Save current as template'}
            </button>
          </div>

          {showSave && (
            <div className="flex flex-wrap items-end gap-3 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Template name</label>
                <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Monthly check-in"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Visibility</label>
                <select value={tplScope} onChange={e => setTplScope(e.target.value as 'personal' | 'shared')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="personal">Personal</option>
                  <option value="shared">Shared with admins</option>
                </select>
              </div>
              <button onClick={saveTemplate} disabled={tplBusy}
                className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: '#0f1f3d' }}>
                {tplBusy ? 'Saving…' : 'Save template'}
              </button>
            </div>
          )}

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Recipients {recipientCount > 0 && <span className="text-slate-400 normal-case font-medium">({recipientCount})</span>}
          </label>
          <textarea
            value={recipients}
            onChange={e => setRecipients(e.target.value)}
            rows={2}
            placeholder="one@example.com, two@example.com — separate with commas, spaces, or new lines."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 mb-4"
          />

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject line"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 mb-4"
          />

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Message</label>
          <div className="mb-4">
            <RichEditor value={message} onChange={setMessage} placeholder="Write your message — use the toolbar for fonts, sizes, colors, lists and links." />
          </div>

          {/* Attachments */}
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Attachments <span className="text-slate-400 normal-case font-medium">(up to 20 MB total{totalBytes > 0 ? ` — ${prettySize(totalBytes)} used` : ''})</span>
          </label>
          <div className="mb-5">
            {attachments.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {attachments.map((a, i) => (
                  <li key={a.path} className="flex items-center justify-between gap-3 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="truncate">📎 {a.filename} <span className="text-slate-400">{prettySize(a.size)}</span></span>
                    <button onClick={() => removeAttachment(i)} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-slate-50">
              {uploading ? <><Spinner size="sm" /> Uploading…</> : '+ Add files'}
              <input type="file" multiple className="hidden" onChange={onPickFiles} disabled={uploading} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" checked={mode === 'now'} onChange={() => setMode('now')} /> Send now
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" checked={mode === 'later'} onChange={() => setMode('later')} /> Schedule for later
            </label>
            {mode === 'later' && (
              <input
                type="datetime-local"
                value={scheduledFor}
                min={nowLocalInput()}
                onChange={e => setScheduledFor(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            )}
          </div>

          <button
            onClick={submit}
            disabled={sending || uploading}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: '#0f1f3d' }}
          >
            {sending && <Spinner size="sm" />}
            {mode === 'later' ? 'Schedule email' : `Send email${recipientCount > 1 ? ` (${recipientCount})` : ''}`}
          </button>
        </div>

        {/* Manage saved templates */}
        {templates.some(t => t.mine) && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">My templates</h2>
            <div className="card divide-y divide-slate-100">
              {templates.filter(t => t.mine).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm text-slate-700">{t.name} <span className="text-xs text-slate-400">· {t.scope}</span></span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => applyTemplate(t.id)} className="text-xs font-semibold text-blue-600 hover:underline">Use</button>
                    <button onClick={() => deleteTemplate(t.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recent & scheduled</h2>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : campaigns.length === 0 ? (
            <EmptyState icon="✉️" title="No emails yet" description="Composed emails and scheduled sends will show up here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {campaigns.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${STATUS_STYLES[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                      <span className="font-semibold text-slate-800 truncate">{c.subject}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.total} recipient{c.total === 1 ? '' : 's'}
                      {c.status === 'scheduled' && c.scheduled_for && <> · scheduled for {fmt(c.scheduled_for)}</>}
                      {(c.status === 'sent' || c.status === 'failed') && <> · {c.sent_count} sent{c.failed_count ? `, ${c.failed_count} failed` : ''} · {fmt(c.sent_at)}</>}
                      {c.status === 'canceled' && <> · canceled</>}
                    </div>
                    {c.error && <div className="text-xs text-red-600 mt-1">{c.error}</div>}
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    {c.status === 'scheduled' && (
                      <button onClick={() => cancel(c.id)} className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline">Cancel</button>
                    )}
                    {c.status !== 'sending' && (
                      <button onClick={() => remove(c.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">Delete</button>
                    )}
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
