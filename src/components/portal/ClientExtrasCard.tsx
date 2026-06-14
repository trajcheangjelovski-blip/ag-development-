'use client'
import { useState, useEffect, useCallback } from 'react'

type ClientExtra = {
  id: string
  name: string
  qty_total: number
  qty_used: number
  unit?: string
  block_id?: string | null
}

// Admin: track usage of a client's purchased extras (e.g. extra pages).
export function ClientExtrasCard({ clientId, onChange }: { clientId: string; onChange?: () => void }) {
  const [extras, setExtras] = useState<ClientExtra[]>([])
  const [tableMissing, setTableMissing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', qty: '1' })
  const [showBlock, setShowBlock] = useState(false)
  const [block, setBlock] = useState({ hours: '', tickets: '', price: '', label: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/extras`)
    if (res.ok) {
      const data = await res.json()
      setExtras(data.extras || [])
      setTableMissing(!!data.tableMissing)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!form.name.trim()) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/clients/${clientId}/extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, qty_total: Number(form.qty) || 1 }),
    })
    if (res.ok) {
      setForm({ name: '', qty: '1' })
      setShowAdd(false)
      load()
      onChange?.()
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Failed to add extra')
    }
    setBusy(false)
  }

  async function addBlock() {
    const hours = Number(block.hours) || 0
    const tickets = Number(block.tickets) || 0
    if (hours <= 0 && tickets <= 0) { setError('Enter hours and/or tickets'); return }
    setBusy(true); setError(''); setNotice('')
    const res = await fetch(`/api/clients/${clientId}/extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'block', hours, tickets, price: Number(block.price) || 0, label: block.label }),
    })
    if (res.ok) {
      setBlock({ hours: '', tickets: '', price: '', label: '' })
      setShowBlock(false)
      setNotice(Number(block.price) > 0 ? 'Capacity added and an invoice was created.' : 'Capacity added to the plan.')
      load()
      onChange?.()
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Failed to add capacity')
    }
    setBusy(false)
  }

  async function adjust(extraId: string, delta: 1 | -1) {
    setBusy(true)
    await fetch(`/api/clients/${clientId}/extras`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extra_id: extraId, delta }),
    })
    await load()
    onChange?.()
    setBusy(false)
  }

  async function remove(extraId: string) {
    setBusy(true)
    await fetch(`/api/clients/${clientId}/extras?extra_id=${extraId}`, { method: 'DELETE' })
    await load()
    onChange?.()
    setBusy(false)
  }

  async function removeBlock(ids: string[]) {
    setBusy(true)
    await Promise.all(ids.map(extraId =>
      fetch(`/api/clients/${clientId}/extras?extra_id=${extraId}`, { method: 'DELETE' })
    ))
    await load()
    onChange?.()
    setBusy(false)
  }

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Extras &amp; Capacity</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowBlock(v => !v); setShowAdd(false) }} className="text-xs text-blue-600 hover:underline font-medium">
            {showBlock ? 'Cancel' : '+ Add Capacity'}
          </button>
          <button onClick={() => { setShowAdd(v => !v); setShowBlock(false) }} className="text-xs text-blue-600 hover:underline font-medium">
            {showAdd ? 'Cancel' : '+ Add Extra'}
          </button>
        </div>
      </div>

      {tableMissing && (
        <p className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: '#fffbeb', color: '#92400e' }}>
          Run the latest <code>pending-migrations.sql</code> (section 4i) to enable extras tracking.
        </p>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {notice && <p className="text-xs text-green-600 mb-2">{notice}</p>}

      {showBlock && (
        <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Add capacity block (stacks on the plan)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <div>
              <label className="text-[11px] text-slate-500">+ Hours</label>
              <input type="number" min="0" step="0.5" className="form-input text-sm py-2" placeholder="5" value={block.hours} onChange={e => setBlock(b => ({ ...b, hours: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">+ Tickets</label>
              <input type="number" min="0" className="form-input text-sm py-2" placeholder="10" value={block.tickets} onChange={e => setBlock(b => ({ ...b, tickets: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Price ($)</label>
              <input type="number" min="0" className="form-input text-sm py-2" placeholder="49" value={block.price} onChange={e => setBlock(b => ({ ...b, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Label (optional)</label>
              <input className="form-input text-sm py-2" placeholder="Top-up" value={block.label} onChange={e => setBlock(b => ({ ...b, label: e.target.value }))} />
            </div>
          </div>
          <button onClick={addBlock} disabled={busy} className="btn-secondary text-xs px-3">Add capacity{Number(block.price) > 0 ? ' + invoice' : ''}</button>
        </div>
      )}

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input className="form-input text-sm py-2 flex-1" placeholder="e.g. Extra Website Page" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <input type="number" min="1" className="form-input text-sm py-2 w-16" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} />
          <button onClick={add} disabled={busy || !form.name.trim()} className="btn-secondary text-xs px-3 flex-shrink-0">Add</button>
        </div>
      )}

      {!extras.length && !tableMissing ? (
        <p className="text-xs text-slate-400">No extras tracked. Add the extras included in this client&apos;s plan (e.g. &quot;Extra Website Page × 2&quot;) and mark them as used.</p>
      ) : (
        <div className="space-y-2.5">
          {/* Capacity blocks — group the hours + tickets rows of one block into a single card */}
          {(() => {
            const capacity = extras.filter(x => x.unit === 'hours' || x.unit === 'tickets')
            const groups: Record<string, ClientExtra[]> = {}
            for (const x of capacity) { const k = x.block_id || x.id; (groups[k] ||= []).push(x) }
            return Object.entries(groups).map(([k, rows]) => {
              const hrs = rows.filter(r => r.unit === 'hours').reduce((s, r) => s + r.qty_total, 0)
              const tix = rows.filter(r => r.unit === 'tickets').reduce((s, r) => s + r.qty_total, 0)
              const parts = [hrs > 0 ? `+${hrs}h` : '', tix > 0 ? `+${tix} tickets` : ''].filter(Boolean).join('  ')
              return (
                <div key={k} className="border border-blue-100 bg-blue-50/40 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-700 truncate">{rows[0].name}</span>
                    <div className="text-xs text-blue-700 font-medium">{parts} added to plan allowance</div>
                  </div>
                  <button onClick={() => removeBlock(rows.map(r => r.id))} disabled={busy} className="text-[11px] text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                </div>
              )
            })
          })()}

          {/* Item add-ons (manual used counter) */}
          {extras.filter(x => x.unit !== 'hours' && x.unit !== 'tickets').map(x => {
            const done = x.qty_used >= x.qty_total
            return (
              <div key={x.id} className="border border-slate-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-700 truncate">{x.name}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${done ? 'text-red-500' : 'text-slate-500'}`}>
                    {x.qty_used} / {x.qty_total} used
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (x.qty_used / x.qty_total) * 100)}%`, background: done ? '#ef4444' : '#2563eb' }}
                    />
                  </div>
                  <button onClick={() => adjust(x.id, 1)} disabled={busy || done} className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-40 flex-shrink-0">
                    Use 1
                  </button>
                  <button onClick={() => adjust(x.id, -1)} disabled={busy || x.qty_used === 0} className="text-[11px] font-medium text-slate-400 hover:text-slate-600 disabled:opacity-40 flex-shrink-0">
                    Undo
                  </button>
                  <button onClick={() => remove(x.id)} disabled={busy} className="text-[11px] text-red-400 hover:text-red-600 flex-shrink-0">
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
