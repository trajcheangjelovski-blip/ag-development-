'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Spinner } from '@/components/ui'

// A free, always-available way for clients to message AG Development —
// works even when their plan is expired or their support credits are used up.
// Posts a "Message" ticket (kind: 'message'), which the API exempts from the
// plan-expiry/credit block and never counts against the support allowance.
export function MessageForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ subject: '', message: '' })
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.message.trim()) errs.message = 'Message is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'message',
        category: 'Message',
        client_id: clientId,
        title: form.subject,
        description: form.message,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to send your message. Please try again.')
      setLoading(false)
      return
    }

    const ticket = await res.json()
    router.push(`/portal/message/${ticket.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="mb-4">
        <label className="form-label">Subject <span className="text-red-500">*</span></label>
        <input
          className={`form-input ${errors.subject ? 'form-input-error' : ''}`}
          placeholder="What's this about?"
          value={form.subject}
          onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: undefined })) }}
        />
        {errors.subject && <p className="form-error">{errors.subject}</p>}
      </div>

      <div className="mb-6">
        <label className="form-label">Message <span className="text-red-500">*</span></label>
        <textarea
          className={`form-input min-h-40 resize-y ${errors.message ? 'form-input-error' : ''}`}
          placeholder="Write your message to AG Development. This goes straight to us — even if your plan has expired."
          value={form.message}
          onChange={e => { setForm(p => ({ ...p, message: e.target.value })); setErrors(p => ({ ...p, message: undefined })) }}
        />
        {errors.message && <p className="form-error">{errors.message}</p>}
      </div>

      <p className="text-xs text-slate-400 mb-5">
        Messages are free and don&apos;t use any of your support requests. We&apos;ll reply by email and here in your portal.
      </p>

      <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Message'}
      </button>
    </form>
  )
}
