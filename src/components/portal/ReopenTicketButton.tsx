'use client'
import { useState } from 'react'
import { Spinner, Alert } from '@/components/ui'

export function ReopenTicketButton({ ticketId, ticketTitle }: { ticketId: string; ticketTitle: string }) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [reopening, setReopening] = useState(false)
  const [reopened, setReopened] = useState(false)
  const [error, setError] = useState('')

  async function handleReopen() {
    if (reason.trim().length < 20) {
      setError('Please provide at least 20 characters explaining why you need to reopen this ticket.')
      return
    }
    setReopening(true)
    setError('')
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Open', reason: reason.trim() }),
    })
    if (res.ok) {
      setShowModal(false)
      setReason('')
      setReopened(true)
      // Full reload — guarantees the server re-renders with fresh data,
      // bypassing any client-side router cache.
      window.location.reload()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to reopen ticket')
    }
    setReopening(false)
  }

  if (reopened) {
    return (
      <span className="text-xs text-green-600 font-semibold px-2 py-0.5">
        ✓ Reopened
      </span>
    )
  }

  return (
    <>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setReason(''); setError(''); setShowModal(true) }}
        className="text-xs text-amber-700 font-semibold hover:text-amber-900 transition-colors px-2 py-0.5 rounded hover:bg-amber-50"
        title="Reopen this ticket"
      >
        ↺ Reopen
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-slate-800">Reopen this ticket?</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-slate-500 mb-1 font-medium truncate">{ticketTitle}</p>
            <p className="text-sm text-slate-600 mb-4">
              Please describe why you need to reopen this ticket so we can help you faster.
            </p>
            {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
            <div className="mb-5">
              <label className="form-label">Reason for reopening <span className="text-red-500">*</span></label>
              <textarea
                className="form-input min-h-[90px] resize-none"
                placeholder="e.g. The issue has returned — the same error appeared again…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                autoFocus
              />
              <div className={`text-xs mt-1 ${reason.trim().length < 20 && reason.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {reason.trim().length}/20 minimum characters
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-500 transition-all disabled:opacity-60"
                onClick={handleReopen}
                disabled={reopening || reason.trim().length < 20}
              >
                {reopening ? <><Spinner size="sm" /> Reopening…</> : '↺ Reopen Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
