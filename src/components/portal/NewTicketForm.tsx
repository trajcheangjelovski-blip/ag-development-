'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Alert, Spinner } from '@/components/ui'
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/lib/utils'

interface NewTicketFormProps {
  clientId: string
  clients?: { id: string; business_name: string }[]
  isAdmin?: boolean
  cancelHref: string
}

export function NewTicketForm({ clientId, clients, isAdmin, cancelHref }: NewTicketFormProps) {
  const t = useTranslations('portal.newTicketForm')
  const tc = useTranslations('portal.common')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_id: isAdmin ? '' : clientId,
    title: '',
    category: '',
    priority: 'Medium',
    description: '',
    affected_site: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attachments, setAttachments] = useState<File[]>([])

  function addAttachments(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const oversize = files.find(f => f.size > 200 * 1024 * 1024)
    if (oversize) {
      setError(t('oversize', { name: oversize.name }))
      e.target.value = ''
      return
    }
    setError('')
    setAttachments(prev => [...prev, ...files])
    e.target.value = ''
  }

  function validate() {
    const e: Record<string, string> = {}
    if (isAdmin && !form.client_id) e.client_id = t('errClient')
    if (!form.title.trim()) e.title = t('errTitle')
    if (!form.category) e.category = t('errCategory')
    if (!form.description.trim()) e.description = t('errDescription')
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || t('failCreate'))
      setLoading(false)
      return
    }

    const ticket = await res.json()

    // Upload attachments and post them as the first message on the ticket
    if (attachments.length) {
      try {
        const links: string[] = []
        for (const file of attachments) {
          const data = new FormData()
          data.append('file', file)
          const upRes = await fetch(`/api/tickets/${ticket.id}/attachments`, { method: 'POST', body: data })
          const up = await upRes.json()
          if (upRes.ok) links.push(`📎 ${up.name} (${(up.size / 1024 / 1024).toFixed(1)} MB): ${up.url}`)
        }
        if (links.length) {
          await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticket.id, body: `Attachments:\n${links.join('\n')}`, comment_type: 'public' }),
          })
        }
      } catch {
        // Ticket is created — attachment failures shouldn't block navigation
      }
    }

    router.push(isAdmin ? `/admin/tickets/${ticket.id}` : `/portal/tickets/${ticket.id}`)
  }

  const f = (id: keyof typeof form) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<any>) => {
      setForm(prev => ({ ...prev, [id]: e.target.value }))
      setErrors(prev => ({ ...prev, [id]: '' }))
    },
  })

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {isAdmin && clients && (
        <div className="mb-4">
          <label className="form-label">{t('clientLabel')} <span className="text-red-500">*</span></label>
          <select className={`form-input ${errors.client_id ? 'form-input-error' : ''}`} {...f('client_id')}>
            <option value="">{t('selectClient')}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          {errors.client_id && <p className="form-error">{errors.client_id}</p>}
        </div>
      )}

      <div className="mb-4">
        <label className="form-label">{t('titleLabel')} <span className="text-red-500">*</span></label>
        <input className={`form-input ${errors.title ? 'form-input-error' : ''}`} placeholder={t('titlePlaceholder')} {...f('title')} />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">{t('categoryLabel')} <span className="text-red-500">*</span></label>
          <select className={`form-input ${errors.category ? 'form-input-error' : ''}`} {...f('category')}>
            <option value="">{t('selectCategory')}</option>
            {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>
        <div>
          <label className="form-label">{t('priorityLabel')}</label>
          <select className="form-input" {...f('priority')}>
            {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label">{t('affectedLabel')}</label>
        <input className="form-input" placeholder={t('affectedPlaceholder')} {...f('affected_site')} />
      </div>

      <div className="mb-6">
        <label className="form-label">{t('descriptionLabel')} <span className="text-red-500">*</span></label>
        <textarea
          className={`form-input min-h-32 resize-y ${errors.description ? 'form-input-error' : ''}`}
          placeholder={t('descriptionPlaceholder')}
          {...f('description')}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="mb-6">
        <label className="form-label">{t('attachmentsLabel')}</label>
        {attachments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {attachments.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span>📎</span>
                <span className="font-medium text-slate-700 truncate flex-1">{f.name}</span>
                <span className="text-slate-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button
                  type="button"
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
        <label className="btn-ghost text-sm cursor-pointer inline-flex items-center gap-1.5">
          {t('attachButton')}
          <input type="file" multiple className="hidden" onChange={addAttachments} disabled={loading} />
        </label>
        <p className="text-xs text-slate-400 mt-1.5">{t('attachHint')}</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push(cancelHref)}
          disabled={loading}
        >
          {tc('cancel')}
        </button>
        <button type="submit" disabled={loading} className="btn-secondary flex items-center gap-2">
          {loading ? <><Spinner size="sm" /> {t('submitting')}</> : t('submit')}
        </button>
      </div>
    </form>
  )
}
