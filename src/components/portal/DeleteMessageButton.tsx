'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Per-side message delete. Removes the message from the caller's inbox only —
// the other party keeps their copy (see DELETE /api/tickets/[id]).
export function DeleteMessageButton({ id, audience }: { id: string; audience: 'admin' | 'client' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const otherParty = audience === 'admin' ? 'The client will still have their copy.' : 'AG Development will still have their copy.'
    if (!confirm(`Remove this message from your inbox? ${otherParty}`)) return
    setBusy(true)
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else { setBusy(false); alert('Failed to delete message') }
  }

  return (
    <button onClick={onDelete} disabled={busy} className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50">
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
