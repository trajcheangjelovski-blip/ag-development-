'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { StatusBadge, PriorityBadge, SectionCard, Spinner, Alert } from '@/components/ui'
import { formatDate, formatDateTime, formatRelativeTime, formatMinutes, TICKET_STATUSES } from '@/lib/utils'
import type { Ticket, TicketComment, TimeEntry, ProofUpload, ActivityLog, Profile } from '@/types'

const MAX_COMMENT_LENGTH = 5000

// Renders comment text with clickable links (used for file attachments)
function LinkifiedText({ text, light }: { text: string; light?: boolean }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className={`underline font-medium ${light ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}
          >
            {part.length > 60 ? `${part.slice(0, 57)}…` : part}
          </a>
        ) : (
          part
        )
      )}
    </span>
  )
}

interface TicketDetailClientProps {
  ticketId: string
  initialTicket: Ticket
  profile: Profile
}

export default function TicketDetailClient({ ticketId, initialTicket, profile }: TicketDetailClientProps) {
  const t = useTranslations('portal.ticketDetail')
  const tc = useTranslations('portal.common')
  const router = useRouter()
  const isAdmin = profile.role === 'admin'
  // Messages are stored as tickets but get a stripped-down, conversation-style
  // view (no time logging, proof, priority, etc.) and live under /messages.
  const isMessage = initialTicket.category === 'Message'
  const backHref = isMessage
    ? (isAdmin ? '/admin/messages' : '/portal/message')
    : (isAdmin ? '/admin/tickets' : '/portal/tickets')
  const backLabel = isMessage ? t('backToMessages') : t('backToTickets')
  const [ticket, setTicket] = useState<Ticket>(initialTicket)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [proofUploads, setProofUploads] = useState<ProofUpload[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  // Comment state
  const [commentBody, setCommentBody] = useState('')
  const [commentType, setCommentType] = useState<'public' | 'internal'>('public')
  const [postingComment, setPostingComment] = useState(false)

  // Unread admin reply banner (clients only, localStorage-based)
  const [unreadAdminCount, setUnreadAdminCount] = useState(0)
  const hasCheckedUnread = useRef(false)

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState(ticket.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Time modal
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [timeForm, setTimeForm] = useState({ work_date: new Date().toISOString().slice(0,10), minutes: 30, work_note: '', is_billable: false, is_included_in_package: true })
  const [postingTime, setPostingTime] = useState(false)

  // Proof modal
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofForm, setProofForm] = useState({ before_note: '', after_note: '', completion_note: '', video_link: '' })
  const [proofFiles, setProofFiles] = useState<{ before?: File; after?: File }>({})
  const [postingProof, setPostingProof] = useState(false)
  const [error, setError] = useState('')

  // Attachments for the reply box
  const [attachments, setAttachments] = useState<File[]>([])

  // Remote support session link
  const [remoteDraft, setRemoteDraft] = useState<string>((initialTicket as any).remote_url || '')
  const [savingRemote, setSavingRemote] = useState(false)
  async function saveRemote(url: string) {
    setSavingRemote(true)
    setError('')
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remote_url: url }),
    })
    if (res.ok) {
      setTicket(prev => ({ ...prev, remote_url: url } as Ticket))
      setRemoteDraft(url)
    } else {
      setError(t('failSaveRemote'))
    }
    setSavingRemote(false)
  }

  function addAttachments(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const oversize = files.find(f => f.size > 200 * 1024 * 1024)
    if (oversize) {
      setError(t('oversize', { name: oversize.name }))
      e.target.value = ''
      return
    }
    setAttachments(prev => [...prev, ...files])
    e.target.value = ''
  }

  // Reopen modal (clients only)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [reopening, setReopening] = useState(false)
  const [reopenError, setReopenError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [commentsRes, timeRes, proofRes, activityRes] = await Promise.all([
      fetch(`/api/comments?ticket_id=${ticketId}`),
      fetch(`/api/time-entries?ticket_id=${ticketId}`),
      fetch(`/api/proof?ticket_id=${ticketId}`),
      fetch(`/api/tickets/${ticketId}/activity`),
    ])
    if (commentsRes.ok) setComments(await commentsRes.json())
    if (timeRes.ok) setTimeEntries(await timeRes.json())
    if (proofRes.ok) setProofUploads(await proofRes.json())
    if (activityRes.ok) setActivity(await activityRes.json())
    setLoading(false)
  }, [ticketId])

  useEffect(() => { fetchData() }, [fetchData])

  // Check for unread admin replies (client only, runs once after initial load)
  useEffect(() => {
    if (loading || isAdmin || hasCheckedUnread.current) return
    if (!comments.length) return
    hasCheckedUnread.current = true

    const key = `ticket_viewed_${ticketId}`
    const lastViewed = localStorage.getItem(key)
    const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0)

    const unread = comments.filter(c =>
      c.comment_type === 'public' &&
      (c as any).author?.role === 'admin' &&
      new Date(c.created_at) > lastViewedDate
    ).length

    setUnreadAdminCount(unread)
    // Update immediately so the next visit starts fresh
    localStorage.setItem(key, new Date().toISOString())
  }, [comments, loading, isAdmin, ticketId])

  // The client's most recent comment (for "last reply" indicator)
  const myLastReply = useMemo(
    () => [...comments].reverse().find(c => c.author_id === profile.id) ?? null,
    [comments, profile.id]
  )

  async function postComment() {
    if (!commentBody.trim() && !attachments.length) return
    setPostingComment(true)
    setError('')

    // Upload attachments first, then embed download links in the comment
    let body = commentBody.trim()
    if (attachments.length) {
      try {
        const links: string[] = []
        for (const file of attachments) {
          const data = new FormData()
          data.append('file', file)
          const upRes = await fetch(`/api/tickets/${ticketId}/attachments`, { method: 'POST', body: data })
          const up = await upRes.json()
          if (!upRes.ok) throw new Error(up?.error || t('failUpload', { name: file.name }))
          links.push(`📎 ${up.name} (${(up.size / 1024 / 1024).toFixed(1)} MB): ${up.url}`)
        }
        body = [body, ...links].filter(Boolean).join('\n')
      } catch (e) {
        setError(e instanceof Error ? e.message : t('failUploadAttachment'))
        setPostingComment(false)
        return
      }
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, body, comment_type: commentType }),
    })
    if (res.ok) {
      setCommentBody('')
      setAttachments([])
      fetchData()
    } else {
      setError(t('failPostComment'))
    }
    setPostingComment(false)
  }

  async function reopenTicket() {
    if (reopenReason.trim().length < 20) {
      setReopenError(t('reopenReasonError'))
      return
    }
    setReopening(true)
    setReopenError('')
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Open', reason: reopenReason.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(prev => ({ ...prev, status: 'Open', updated_at: updated.updated_at || prev.updated_at }))
      setShowReopenModal(false)
      setReopenReason('')
      router.refresh()
      fetchData()
    } else {
      const data = await res.json()
      setReopenError(data.error || t('failReopen'))
    }
    setReopening(false)
  }

  async function closeTicket() {
    if (!confirm(t('confirmClose'))) return
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Closed' }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(prev => ({ ...prev, status: 'Closed', updated_at: updated?.updated_at || prev.updated_at }))
      fetchData()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || t('failCloseTicket'))
    }
  }

  async function deleteMessage() {
    const otherParty = isAdmin ? t('copyAdmin') : t('copyClient')
    if (!confirm(`${t('confirmDeletePrefix')} ${otherParty}`)) return
    const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' })
    if (res.ok) router.push(isAdmin ? '/admin/messages' : '/portal/message')
    else setError(t('failDeleteMessage'))
  }

  async function updateStatus() {
    setUpdatingStatus(true)
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(updated)
      setShowStatusModal(false)
      fetchData()
    }
    setUpdatingStatus(false)
  }

  async function logTime() {
    setPostingTime(true)
    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...timeForm, ticket_id: ticketId, client_id: ticket.client_id }),
    })
    if (res.ok) {
      setShowTimeModal(false)
      setTimeForm({ work_date: new Date().toISOString().slice(0,10), minutes: 30, work_note: '', is_billable: false, is_included_in_package: true })
      fetchData()
    }
    setPostingTime(false)
  }

  async function uploadProof() {
    setPostingProof(true)
    setError('')
    try {
      let before_image_url = ''
      let after_image_url = ''

      if (proofFiles.before) {
        const fd = new FormData()
        fd.append('file', proofFiles.before)
        fd.append('ticket_id', ticketId)
        fd.append('type', 'before')
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        if (r.ok) { const d = await r.json(); before_image_url = d.url }
      }

      if (proofFiles.after) {
        const fd = new FormData()
        fd.append('file', proofFiles.after)
        fd.append('ticket_id', ticketId)
        fd.append('type', 'after')
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        if (r.ok) { const d = await r.json(); after_image_url = d.url }
      }

      const res = await fetch('/api/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...proofForm, ticket_id: ticketId, before_image_url, after_image_url }),
      })

      if (res.ok) {
        setShowProofModal(false)
        setProofForm({ before_note: '', after_note: '', completion_note: '', video_link: '' })
        setProofFiles({})
        fetchData()
      } else {
        setError(t('failSaveProof'))
      }
    } catch {
      setError(t('uploadFailedRetry'))
    }
    setPostingProof(false)
  }

  const totalMins = timeEntries.reduce((s, t) => s + t.minutes, 0)
  const charCount = commentBody.length
  const charWarning = charCount > MAX_COMMENT_LENGTH * 0.9

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <button
        onClick={() => router.push(backHref)}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-5"
      >
        {backLabel}
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-800 mb-2 break-words">{ticket.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            {!isMessage && <PriorityBadge priority={ticket.priority} />}
            {!isMessage && <span className="text-xs text-slate-400">{ticket.category}</span>}
            {isMessage && <span className="text-xs text-slate-400">{t('message')}</span>}
            {isAdmin && (ticket as any).client && (
              <span className="text-xs text-slate-400">· {(ticket as any).client.business_name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button className="btn-ghost text-sm" onClick={() => { setNewStatus(ticket.status); setShowStatusModal(true) }}>
                {t('changeStatus')}
              </button>
              {!isMessage && (
                <>
                  <button className="btn-ghost text-sm" onClick={() => setShowTimeModal(true)}>
                    {t('logTime')}
                  </button>
                  <button className="btn-ghost text-sm" onClick={() => setShowProofModal(true)}>
                    {t('addProof')}
                  </button>
                </>
              )}
              {isMessage && (
                <button className="btn-ghost text-sm text-red-600 hover:text-red-700" onClick={deleteMessage}>
                  {t('deleteBtn')}
                </button>
              )}
            </>
          )}
          {!isAdmin && !isMessage && ['Completed', 'Closed'].includes(ticket.status) && (
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-all"
              onClick={() => { setReopenReason(''); setReopenError(''); setShowReopenModal(true) }}
            >
              {t('reopenTicketBtn')}
            </button>
          )}
          {!isAdmin && !isMessage && !['Completed', 'Closed'].includes(ticket.status) && (
            <button className="btn-ghost text-sm" onClick={closeTicket}>
              {t('closeTicketBtn')}
            </button>
          )}
          {!isAdmin && isMessage && (
            <button className="btn-ghost text-sm text-red-600 hover:text-red-700" onClick={deleteMessage}>
              {t('deleteBtn')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* ── Remote support session ── */}
      {!isMessage && (isAdmin || ticket.remote_url) && (
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">{t('remoteSession')}</span>
          {ticket.remote_url && (
            <a href={ticket.remote_url} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              {t('joinRemote')}
            </a>
          )}
          {isAdmin ? (
            <div className="flex items-center gap-2 w-full sm:flex-1 sm:w-auto sm:min-w-[240px]">
              <input
                className="form-input text-sm py-1.5 flex-1 min-w-0"
                placeholder={t('remotePlaceholder')}
                value={remoteDraft}
                onChange={e => setRemoteDraft(e.target.value)}
              />
              <button onClick={() => saveRemote(remoteDraft.trim())} disabled={savingRemote} className="btn-ghost text-sm flex-shrink-0">
                {savingRemote ? t('saving') : ticket.remote_url ? t('update') : t('save')}
              </button>
              {ticket.remote_url && (
                <button onClick={() => saveRemote('')} disabled={savingRemote} className="text-xs text-red-500 hover:text-red-600 flex-shrink-0">{t('clear')}</button>
              )}
            </div>
          ) : (
            !ticket.remote_url && <span className="text-xs text-slate-400">{t('noActiveRemote')}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Description */}
          <div className="card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{isMessage ? t('message') : t('description')}</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            {ticket.affected_site && (
              <div className="mt-3 text-sm text-slate-500">
                <strong>{t('affected')}</strong> {ticket.affected_site}
              </div>
            )}
          </div>

          {/* Proof uploads */}
          {proofUploads.length > 0 && (
            <div className="card p-6 border-2 border-green-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-4">{t('proofOfWork')}</h3>
              {proofUploads.map(p => (
                <div key={p.id} className="space-y-3">
                  {p.before_note && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('before')}</div>
                      <p className="text-sm text-slate-600 bg-red-50 rounded-lg p-3">{p.before_note}</p>
                    </div>
                  )}
                  {p.before_image_url && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('beforeScreenshot')}</div>
                      <img src={p.before_image_url} alt="Before" className="rounded-lg border border-slate-200 max-h-64 max-w-full object-cover" />
                    </div>
                  )}
                  {p.after_note && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('after')}</div>
                      <p className="text-sm text-slate-600 bg-green-50 rounded-lg p-3">{p.after_note}</p>
                    </div>
                  )}
                  {p.after_image_url && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('afterScreenshot')}</div>
                      <img src={p.after_image_url} alt="After" className="rounded-lg border border-slate-200 max-h-64 max-w-full object-cover" />
                    </div>
                  )}
                  {p.completion_note && (
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('completionNote')}</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{p.completion_note}</p>
                    </div>
                  )}
                  {p.video_link && (
                    <a href={p.video_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {t('viewProofVideo')}
                    </a>
                  )}
                  <div className="text-xs text-slate-400">{formatDateTime(p.created_at)}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Comments ── */}
          <div className="card overflow-hidden">
            {/* Unread admin reply banner — clients only */}
            {!isAdmin && unreadAdminCount > 0 && (
              <div className="flex items-start gap-3 bg-blue-50 border-b border-blue-200 px-5 py-3.5">
                <span className="text-lg mt-0.5 flex-shrink-0">💬</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    {t('newReplies', { count: unreadAdminCount })}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">{t('scrollDown')}</p>
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isMessage ? t('conversation') : t('comments')}
                {comments.length > 0 && (
                  <span className="ml-2 text-slate-400 normal-case font-normal">({comments.length})</span>
                )}
              </h3>
            </div>

            {/* Comment list */}
            <div className="px-5 py-4">
              {loading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  {t('noCommentsPrefix')} {isAdmin ? t('beFirstReply') : t('weWillReply')}
                </p>
              ) : (
                <div className="space-y-5 mb-2">
                  {comments.map((c, idx) => {
                    const isReopenComment = c.body.startsWith('🔄 Ticket reopened')
                    const isClosedComment = c.body.startsWith('🔒 Ticket closed')
                    const isCompletedComment = c.body.startsWith('✅ Ticket marked as completed')
                    const isSystemComment = isReopenComment || isClosedComment || isCompletedComment
                    const isNewAdminReply =
                      !isAdmin &&
                      unreadAdminCount > 0 &&
                      (c as any).author?.role === 'admin' &&
                      idx >= comments.length - unreadAdminCount

                    return (
                      <div
                        key={c.id}
                        className={`flex gap-3 ${isNewAdminReply ? 'relative' : ''}`}
                      >
                        {isNewAdminReply && (
                          <div className="absolute -left-5 top-0 bottom-0 w-0.5 bg-blue-400 rounded-full" />
                        )}
                        {!isSystemComment && (c as any).author?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(c as any).author.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-slate-200"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0 mt-0.5"
                            style={{
                              background: isReopenComment
                                ? '#92400e'
                                : isCompletedComment
                                ? '#16a34a'
                                : isClosedComment
                                ? '#475569'
                                : (c as any).author?.role === 'admin' ? '#0f1f3d' : '#2563eb',
                            }}
                          >
                            {isReopenComment
                              ? '↺'
                              : isCompletedComment
                              ? '✓'
                              : isClosedComment
                              ? '🔒'
                              : (c as any).author?.role === 'admin'
                              ? 'AG'
                              : (c as any).author?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                            }
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-slate-800">
                              {(c as any).author?.role === 'admin' ? 'AG Development' : (c as any).author?.full_name}
                            </span>
                            <span
                              className="text-xs text-slate-400 cursor-default"
                              title={formatDateTime(c.created_at)}
                            >
                              {formatRelativeTime(c.created_at)}
                            </span>
                            {isReopenComment && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                {t('ticketReopened')}
                              </span>
                            )}
                            {isCompletedComment && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                {t('ticketCompleted')}
                              </span>
                            )}
                            {isClosedComment && (
                              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                {t('ticketClosed')}
                              </span>
                            )}
                            {c.comment_type === 'internal' && !isReopenComment && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                {t('internalNote')}
                              </span>
                            )}
                            {isNewAdminReply && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                {t('newBadge')}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-sm leading-relaxed p-3.5 rounded-xl ${
                              isReopenComment
                                ? 'bg-orange-50 border border-orange-200 text-orange-900'
                                : isCompletedComment
                                ? 'bg-green-50 border border-green-200 text-green-900'
                                : isClosedComment
                                ? 'bg-slate-100 border border-slate-200 text-slate-600'
                                : c.comment_type === 'internal'
                                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                                : (c as any).author?.role === 'admin'
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            <LinkifiedText
                              text={c.body}
                              light={!isSystemComment && c.comment_type !== 'internal' && (c as any).author?.role === 'admin'}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Reply box ── */}
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              {/* Last reply indicator — clients only */}
              {!isAdmin && myLastReply && (
                <p className="text-xs text-slate-400 mb-3">
                  {t('yourLastReply')}{' '}
                  <span className="text-slate-500 font-medium" title={formatDateTime(myLastReply.created_at)}>
                    {formatRelativeTime(myLastReply.created_at)}
                  </span>
                </p>
              )}

              {/* Comment type toggle — admins only (not for plain messages) */}
              {isAdmin && !isMessage && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setCommentType('public')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      commentType === 'public' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('publicReply')}
                  </button>
                  <button
                    onClick={() => setCommentType('internal')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      commentType === 'internal' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('internalNoteBtn')}
                  </button>
                </div>
              )}

              <textarea
                className={`form-input min-h-[90px] resize-none mb-1 ${
                  commentType === 'internal' ? 'border-amber-300 bg-amber-50 focus:border-amber-400' : ''
                }`}
                placeholder={
                  commentType === 'internal'
                    ? t('placeholderInternal')
                    : isAdmin
                    ? t('placeholderAdminReply')
                    : t('placeholderClientReply')
                }
                value={commentBody}
                onChange={e => setCommentBody(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                maxLength={MAX_COMMENT_LENGTH}
              />

              {/* Character counter */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs transition-colors ${
                    charCount >= MAX_COMMENT_LENGTH
                      ? 'text-red-500 font-semibold'
                      : charWarning
                      ? 'text-amber-500'
                      : 'text-slate-400'
                  }`}
                >
                  {charCount > 0 ? `${charCount.toLocaleString()} / ${MAX_COMMENT_LENGTH.toLocaleString()}` : ''}
                </span>
              </div>

              {/* Pending attachments */}
              {attachments.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {attachments.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span>📎</span>
                      <span className="font-medium text-slate-700 truncate flex-1">{f.name}</span>
                      <span className="text-slate-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, x) => x !== i))}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                        aria-label={t('removeAria', { name: f.name })}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={postComment}
                  disabled={postingComment || (!commentBody.trim() && !attachments.length)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  {postingComment ? <><Spinner size="sm" /> {t('posting')}</> : isAdmin ? t('postReply') : t('sendMessage')}
                </button>
                <label className="btn-ghost text-sm cursor-pointer flex items-center gap-1.5">
                  {t('attachFiles')}
                  <input type="file" multiple className="hidden" onChange={addAttachments} disabled={postingComment} />
                </label>
                <span className="text-xs text-slate-400 w-full sm:w-auto">{t('attachHint')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <SectionCard title={isMessage ? t('messageDetails') : t('ticketDetails')}>
            {(isMessage
              ? [
                  [t('fieldId'), '#' + ticketId.slice(0,8).toUpperCase()],
                  [t('fieldStatus'), ticket.status],
                  [t('fieldStarted'), formatDate(ticket.created_at)],
                  [t('fieldUpdated'), formatDate(ticket.updated_at)],
                ]
              : [
                  [t('fieldId'), '#' + ticketId.slice(0,8).toUpperCase()],
                  [t('fieldStatus'), ticket.status],
                  [t('fieldPriority'), ticket.priority],
                  [t('fieldCategory'), ticket.category],
                  [t('fieldCreated'), formatDate(ticket.created_at)],
                  [t('fieldUpdated'), formatDate(ticket.updated_at)],
                ]
            ).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">{l}</span>
                <span className="font-semibold text-slate-800 text-right">{v}</span>
              </div>
            ))}
          </SectionCard>

          {!isMessage && <SectionCard title={t('timeLogged')}>
            <div className="font-display text-2xl font-extrabold text-slate-800 mb-3">{formatMinutes(totalMins)}</div>
            {timeEntries.length === 0 ? (
              <p className="text-xs text-slate-400">{t('noTimeLogged')}</p>
            ) : (
              <div className="space-y-2">
                {timeEntries.map(te => (
                  <div key={te.id} className="flex justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-semibold text-slate-700">{formatMinutes(te.minutes)}</div>
                      <div className="text-slate-400 mt-0.5">{te.work_note}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-slate-400">{formatDate(te.work_date)}</div>
                      <div className={te.is_included_in_package ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {te.is_included_in_package ? t('included') : t('extra')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>}

          {!isMessage && <SectionCard title={t('activityLog')}>
            {activity.length === 0 ? (
              <p className="text-xs text-slate-400">{t('noActivity')}</p>
            ) : (
              <div className="space-y-2">
                {activity.map(a => (
                  <div key={a.id} className="flex gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                    <div>
                      <div className="font-semibold text-slate-700">{a.action}</div>
                      {a.detail && <div className="text-slate-400">{a.detail}</div>}
                      <div className="text-slate-300">{(a as any).actor?.full_name} · {formatRelativeTime(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>}
        </div>
      </div>

      {/* ── Reopen Modal ── */}
      {showReopenModal && (
        <Modal title={t('reopenTitleQ')} onClose={() => setShowReopenModal(false)}>
          <p className="text-sm text-slate-600 mb-4">
            {t('reopenPrompt')}
          </p>
          {reopenError && (
            <div className="mb-4">
              <Alert type="error" message={reopenError} />
            </div>
          )}
          <div className="mb-5">
            <label className="form-label">{t('reasonLabel')} <span className="text-red-500">*</span></label>
            <textarea
              className="form-input min-h-[100px] resize-none"
              placeholder={t('reopenPlaceholder')}
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              autoFocus
            />
            <div className={`text-xs mt-1 ${reopenReason.trim().length < 20 && reopenReason.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {t('minChars', { count: reopenReason.trim().length })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowReopenModal(false)}>{tc('cancel')}</button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-500 transition-all disabled:opacity-60"
              onClick={reopenTicket}
              disabled={reopening || reopenReason.trim().length < 20}
            >
              {reopening ? <><Spinner size="sm" /> {t('reopening')}</> : t('reopenTicketBtn')}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Status Modal ── */}
      {showStatusModal && (
        <Modal title={t('statusModalTitle')} onClose={() => setShowStatusModal(false)}>
          <div className="mb-5">
            <label className="form-label">{t('newStatusLabel')}</label>
            <select className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value as any)}>
              {/* "Waiting Client" is set automatically when you reply, so it's not
                  a manual option (unless the ticket is already in that state). */}
              {TICKET_STATUSES
                .filter(s => s !== 'Waiting Client' || ticket.status === 'Waiting Client')
                .map(s => <option key={s}>{s}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">{t('waitingClientNote')}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowStatusModal(false)}>{tc('cancel')}</button>
            <button className="btn-secondary flex items-center gap-2" onClick={updateStatus} disabled={updatingStatus}>
              {updatingStatus ? <><Spinner size="sm" /> {t('updating')}</> : t('updateStatus')}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Time Entry Modal ── */}
      {showTimeModal && (
        <Modal title={t('logTimeTitle')} onClose={() => setShowTimeModal(false)}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="form-label">{t('dateLabel')}</label>
              <input type="date" className="form-input" value={timeForm.work_date} onChange={e => setTimeForm(p => ({ ...p, work_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">{t('minutesSpent')}</label>
              <input type="number" className="form-input" min="1" value={timeForm.minutes} onChange={e => setTimeForm(p => ({ ...p, minutes: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('workNote')}</label>
            <input className="form-input" placeholder={t('workNotePlaceholder')} value={timeForm.work_note} onChange={e => setTimeForm(p => ({ ...p, work_note: e.target.value }))} />
          </div>
          <div className="flex gap-5 mb-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={timeForm.is_included_in_package} onChange={e => setTimeForm(p => ({ ...p, is_included_in_package: e.target.checked }))} />
              {t('includedInPackage')}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={timeForm.is_billable} onChange={e => setTimeForm(p => ({ ...p, is_billable: e.target.checked }))} />
              {t('billableExtra')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowTimeModal(false)}>{tc('cancel')}</button>
            <button className="btn-secondary flex items-center gap-2" onClick={logTime} disabled={postingTime}>
              {postingTime ? <><Spinner size="sm" /> {t('saving')}</> : t('logTimeBtn')}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Proof Modal ── */}
      {showProofModal && (
        <Modal title={t('addProofTitle')} onClose={() => setShowProofModal(false)}>
          <div className="space-y-3 mb-4">
            <div>
              <label className="form-label">{t('beforeLabel')}</label>
              <input className="form-input" placeholder={t('beforePlaceholder')} value={proofForm.before_note} onChange={e => setProofForm(p => ({ ...p, before_note: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">{t('beforeScreenshot')}</label>
              <input type="file" accept="image/*" className="form-input py-2" onChange={e => setProofFiles(p => ({ ...p, before: e.target.files?.[0] }))} />
            </div>
            <div>
              <label className="form-label">{t('afterLabel')}</label>
              <input className="form-input" placeholder={t('afterPlaceholder')} value={proofForm.after_note} onChange={e => setProofForm(p => ({ ...p, after_note: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">{t('afterScreenshot')}</label>
              <input type="file" accept="image/*" className="form-input py-2" onChange={e => setProofFiles(p => ({ ...p, after: e.target.files?.[0] }))} />
            </div>
            <div>
              <label className="form-label">{t('completionNote')} <span className="text-red-500">*</span></label>
              <textarea className="form-input min-h-20 resize-none" placeholder={t('completionPlaceholder')} value={proofForm.completion_note} onChange={e => setProofForm(p => ({ ...p, completion_note: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">{t('proofVideoLabel')}</label>
              <input className="form-input" placeholder="https://…" value={proofForm.video_link} onChange={e => setProofForm(p => ({ ...p, video_link: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowProofModal(false)}>{tc('cancel')}</button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-500 transition-all"
              onClick={uploadProof}
              disabled={postingProof || !proofForm.completion_note}
            >
              {postingProof ? <><Spinner size="sm" /> {t('saving')}</> : t('saveProof')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
