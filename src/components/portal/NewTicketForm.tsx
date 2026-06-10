'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Spinner } from '@/components/ui'
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/lib/utils'

interface NewTicketFormProps {
  clientId: string
  clients?: { id: string; business_name: string }[]
  isAdmin?: boolean
  cancelHref: string
}

export function NewTicketForm({ clientId, clients, isAdmin, cancelHref }: NewTicketFormProps) {
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

  function validate() {
    const e: Record<string, string> = {}
    if (isAdmin && !form.client_id) e.client_id = 'Please select a client'
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.description.trim()) e.description = 'Description is required'
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
      setError(data.error || 'Failed to create ticket')
      setLoading(false)
      return
    }

    const ticket = await res.json()
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
          <label className="form-label">Client <span className="text-red-500">*</span></label>
          <select className={`form-input ${errors.client_id ? 'form-input-error' : ''}`} {...f('client_id')}>
            <option value="">Select a client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          {errors.client_id && <p className="form-error">{errors.client_id}</p>}
        </div>
      )}

      <div className="mb-4">
        <label className="form-label">Title <span className="text-red-500">*</span></label>
        <input className={`form-input ${errors.title ? 'form-input-error' : ''}`} placeholder="Brief description of the issue or request" {...f('title')} />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Category <span className="text-red-500">*</span></label>
          <select className={`form-input ${errors.category ? 'form-input-error' : ''}`} {...f('category')}>
            <option value="">Select category...</option>
            {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select className="form-input" {...f('priority')}>
            {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label">Affected Website / Email</label>
        <input className="form-input" placeholder="e.g. yoursite.com or info@yoursite.com" {...f('affected_site')} />
      </div>

      <div className="mb-6">
        <label className="form-label">Description <span className="text-red-500">*</span></label>
        <textarea
          className={`form-input min-h-32 resize-y ${errors.description ? 'form-input-error' : ''}`}
          placeholder="Describe the issue in detail. Include any error messages, what you expected, and steps to reproduce..."
          {...f('description')}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push(cancelHref)}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-secondary flex items-center gap-2">
          {loading ? <><Spinner size="sm" /> Submitting...</> : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}
