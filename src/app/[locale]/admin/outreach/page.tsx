'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert, EmptyState } from '@/components/ui'

// ── Types ──────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  company_name: string | null
  phone: string
  source: string | null
  consent_status: 'granted' | 'unknown' | 'declined'
  opted_out: boolean
  opted_out_at: string | null
  created_at: string
}

type Summary = { total: number; consented: number; optedOut: number }

type Campaign = {
  id: string
  name: string
  message: string
  audience: 'consented' | 'all_not_opted_out'
  status: 'draft' | 'sending' | 'sent' | 'failed'
  total: number
  sent_count: number
  failed_count: number
  error: string | null
  created_at: string
  sent_at: string | null
}

type Banner = { ok: boolean; text: string } | null

const CONSENT_STYLE: Record<string, string> = {
  granted: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-slate-100 text-slate-600',
  declined: 'bg-red-100 text-red-700',
}
const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

// Parse pasted/CSV text into {company, phone} rows. Handles comma/semicolon/tab
// separators, an optional header row, and one- or two-column input.
function parseCsv(text: string): { company: string; phone: string }[] {
  const out: { company: string; phone: string }[] = []
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^"|"$/g, ''))
    // Skip a header row (first line that mentions phone/company and has no digits).
    if (i === 0 && /phone|telefon|број|company|firma|фирма|назив/i.test(line) && !/\d{3}/.test(line)) continue
    if (parts.length === 1) {
      out.push({ company: '', phone: parts[0] })
    } else {
      // The field with the most digits is the phone; the other is the company.
      const digitCount = (s: string) => (s.match(/\d/g) || []).length
      const phoneIdx = digitCount(parts[1]) >= digitCount(parts[0]) ? 1 : 0
      out.push({ phone: parts[phoneIdx], company: parts[1 - phoneIdx] || '' })
    }
  }
  return out
}

export default function OutreachPage() {
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, consented: 0, optedOut: 0 })
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [banner, setBanner] = useState<Banner>(null)
  const [search, setSearch] = useState('')

  // Import form
  const [importText, setImportText] = useState('')
  const [importConsent, setImportConsent] = useState<'granted' | 'unknown'>('unknown')
  const [importSource, setImportSource] = useState('')
  const [importing, setImporting] = useState(false)

  // Compose form
  const [campName, setCampName] = useState('')
  const [campMessage, setCampMessage] = useState('')
  const [campAudience, setCampAudience] = useState<'consented' | 'all_not_opted_out'>('consented')
  const [smsFailover, setSmsFailover] = useState(false)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    try {
      const [cRes, kRes] = await Promise.all([
        fetch('/api/outreach/contacts', { cache: 'no-store' }),
        fetch('/api/outreach/campaigns', { cache: 'no-store' }),
      ])
      const c = await cRes.json()
      const k = await kRes.json()
      if (c.tableMissing || k.tableMissing) { setTableMissing(true); return }
      setContacts(c.contacts || [])
      setSummary(c.summary || { total: 0, consented: 0, optedOut: 0 })
      setCampaigns(k.campaigns || [])
    } catch {
      setBanner({ ok: false, text: 'Could not load outreach data.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // While a campaign is still sending in the background, poll for progress.
  useEffect(() => {
    if (!campaigns.some(k => k.status === 'sending')) return
    const t = setTimeout(load, 3000)
    return () => clearTimeout(t)
  }, [campaigns, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(c => (c.company_name || '').toLowerCase().includes(q) || c.phone.includes(q))
  }, [contacts, search])

  const parsedPreview = useMemo(() => parseCsv(importText), [importText])

  const recipientCount = useMemo(() => {
    if (campAudience === 'consented') return summary.consented
    return summary.total - summary.optedOut
  }, [campAudience, summary])

  async function doImport() {
    const rows = parseCsv(importText)
    if (!rows.length) { setBanner({ ok: false, text: 'Paste at least one number to import.' }); return }
    setImporting(true); setBanner(null)
    try {
      const res = await fetch('/api/outreach/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, source: importSource.trim() || undefined, consent: importConsent }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ ok: false, text: data.error || 'Import failed.' }); return }
      const parts = [`Imported ${data.imported}`]
      if (data.skippedExisting) parts.push(`${data.skippedExisting} already existed`)
      if (data.duplicatesInFile) parts.push(`${data.duplicatesInFile} duplicates in file`)
      if (data.invalid?.length) parts.push(`${data.invalid.length} invalid skipped`)
      setBanner({ ok: true, text: parts.join(' · ') })
      setImportText('')
      load()
    } finally {
      setImporting(false)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportText(await file.text())
  }

  async function toggleOptOut(c: Contact) {
    await fetch(`/api/outreach/contacts/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opted_out: !c.opted_out }),
    })
    load()
  }
  async function setConsent(c: Contact, consent_status: string) {
    await fetch(`/api/outreach/contacts/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent_status }),
    })
    load()
  }
  async function removeContact(c: Contact) {
    if (!confirm(`Delete ${c.company_name || c.phone}?`)) return
    await fetch(`/api/outreach/contacts/${c.id}`, { method: 'DELETE' })
    load()
  }

  async function sendCampaign() {
    if (!campName.trim() || !campMessage.trim()) { setBanner({ ok: false, text: 'Campaign name and message are required.' }); return }
    if (!confirm(`Send this Viber message to ${recipientCount} contact(s)?`)) return
    setSending(true); setBanner(null)
    try {
      const res = await fetch('/api/outreach/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: campName, message: campMessage, audience: campAudience, smsFailover }),
      })
      const data = await res.json()
      if (!res.ok) { setBanner({ ok: false, text: data.error || 'Send failed.' }); return }
      setBanner({ ok: true, text: `Campaign started — sending to ${data.total} contact(s) over Viber. Progress updates below.` })
      setCampName(''); setCampMessage('')
      load()
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <PortalLayout requiredRole="admin"><div className="p-8 flex justify-center"><Spinner size="lg" /></div></PortalLayout>
  }

  if (tableMissing) {
    return (
      <PortalLayout requiredRole="admin">
        <div className="p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Viber Outreach</h1>
          <Alert type="warning" message="Database tables not found. Run supabase/viber-outreach.sql in your Supabase SQL editor, then reload this page." />
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Viber Outreach</h1>
          <div className="flex gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">{summary.total} contacts</span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold">{summary.consented} consented</span>
            <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold">{summary.optedOut} opted out</span>
          </div>
        </div>

        <Alert type="info" message="Only message businesses that have consented, and always honour opt-outs (reply STOP auto-unsubscribes). Bulk messaging without consent can breach Viber's rules and data-protection law." />
        {banner && <Alert type={banner.ok ? 'success' : 'error'} message={banner.text} />}

        {/* ── Import ─────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-1">Import contacts</h2>
          <p className="text-sm text-slate-500 mb-3">Paste rows as <code className="bg-slate-100 px-1 rounded">Company, Phone</code> (one per line) or upload a .csv. Phone can be 070…, +389…, or 389….</p>
          <textarea
            className="w-full border border-slate-200 rounded-lg p-3 text-sm font-mono min-h-[120px]"
            placeholder={"Bloom Florist, 070123456\nCafe Skopje, +389 71 234 567"}
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <label className="text-sm text-slate-600">
              Consent:{' '}
              <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={importConsent} onChange={e => setImportConsent(e.target.value as any)}>
                <option value="unknown">Unknown</option>
                <option value="granted">Granted (they opted in)</option>
              </select>
            </label>
            <input className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" placeholder="Source (optional)" value={importSource} onChange={e => setImportSource(e.target.value)} />
            <label className="text-sm text-blue-600 font-semibold cursor-pointer">
              Upload .csv
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={onFile} />
            </label>
            {importText.trim() && <span className="text-xs text-slate-400">{parsedPreview.length} rows detected</span>}
            <button onClick={doImport} disabled={importing || !importText.trim()}
              className="ml-auto bg-[#0f1f3d] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </section>

        {/* ── Compose & send ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Compose & send</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Campaign name (internal)" value={campName} onChange={e => setCampName(e.target.value)} />
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[140px]"
                placeholder={'Здраво {company}! Нудиме изработка на веб страни за мали бизниси…\n\nОдговорете СТОП за да не добивате пораки.'}
                value={campMessage}
                onChange={e => setCampMessage(e.target.value)}
              />
              <p className="text-xs text-slate-400">Use <code className="bg-slate-100 px-1 rounded">{'{company}'}</code> to insert each business name. Include a STOP note for compliance.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">
                Audience
                <select className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm mt-1" value={campAudience} onChange={e => setCampAudience(e.target.value as any)}>
                  <option value="consented">Consented only (recommended)</option>
                  <option value="all_not_opted_out">Everyone not opted out</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={smsFailover} onChange={e => setSmsFailover(e.target.checked)} />
                SMS fallback if no Viber (billed as SMS)
              </label>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <div className="text-slate-500">Recipients</div>
                <div className="text-2xl font-extrabold text-[#0f1f3d]">{recipientCount}</div>
              </div>
              {campMessage.trim() && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500 mb-1">Preview</div>
                  {campMessage.replace(/\{\s*company\s*\}/gi, contacts[0]?.company_name || 'Your Business')}
                </div>
              )}
              <button onClick={sendCampaign} disabled={sending || recipientCount === 0}
                className="w-full bg-[#7c3aed] text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                {sending ? 'Sending…' : `Send to ${recipientCount} via Viber`}
              </button>
            </div>
          </div>
        </section>

        {/* ── Contacts ───────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="font-bold text-slate-800">Contacts</h2>
            <input className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56" placeholder="Search company or phone" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No contacts yet" description="Import a list above to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Company</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Consent</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 500).map(c => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-medium text-slate-700">{c.company_name || <span className="text-slate-400">—</span>}</td>
                      <td className="py-2 pr-3 text-slate-600 font-mono text-xs">+{c.phone}</td>
                      <td className="py-2 pr-3">
                        <select value={c.consent_status} onChange={e => setConsent(c, e.target.value)}
                          className={`text-xs font-semibold rounded px-1.5 py-0.5 ${CONSENT_STYLE[c.consent_status]}`}>
                          <option value="granted">granted</option>
                          <option value="unknown">unknown</option>
                          <option value="declined">declined</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        {c.opted_out
                          ? <span className="text-xs font-semibold text-red-600">opted out</span>
                          : <span className="text-xs text-emerald-600">active</span>}
                      </td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">
                        <button onClick={() => toggleOptOut(c)} className="text-xs text-slate-500 hover:text-slate-700 mr-3">
                          {c.opted_out ? 'Re-subscribe' : 'Opt out'}
                        </button>
                        <button onClick={() => removeContact(c)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 500 && <p className="text-xs text-slate-400 mt-2">Showing first 500 of {filtered.length}.</p>}
            </div>
          )}
        </section>

        {/* ── Campaign history ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Campaigns</h2>
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet" description="Compose and send your first Viber message above." />
          ) : (
            <div className="space-y-2">
              {campaigns.map(k => (
                <div key={k.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 truncate">{k.name}</div>
                    <div className="text-xs text-slate-400 truncate">{k.message}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-slate-500">{k.sent_count}/{k.total} sent{k.failed_count ? ` · ${k.failed_count} failed` : ''}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${STATUS_STYLE[k.status]}`}>{k.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalLayout>
  )
}
