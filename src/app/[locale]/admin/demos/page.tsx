'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert, EmptyState } from '@/components/ui'

type Demo = {
  slug: string
  title: string
  url: string
  files: number
  bytes: number
  updatedAt: string
  tracked: boolean
}
type LinkRow = {
  code: string; slug: string; label: string; note: string; createdAt: string; createdBy: string
  clicks: number; previews: number; opens: number; visitors: number; totalSeconds: number; lastAt: string | null
}
type DemoStat = { opens: number; opens7d: number; visitors: number; lastAt: string | null }
type Ev = {
  id: string; t: string; type: 'click' | 'open'; slug: string; code?: string; label: string | null
  vid: string; country: string; device: string; browser: string; os: string; referrer?: string; bot?: boolean; dur?: number; pages?: number
}

type Banner = { ok: boolean; text: string } | null

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function ago(iso: string | null) {
  if (!iso) return '—'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString()
}
function dur(sec?: number) {
  if (!sec) return '—'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m}m ${sec % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`
}
function flag(cc: string) {
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX' || cc === 'T1') return '🌐'
  return String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt(0)))
}
const origin = () => (typeof window !== 'undefined' ? window.location.origin : 'https://ag-development.dev')
const goUrl = (code: string) => `${origin()}/go/${code}`

export default function DemosPage() {
  const [loading, setLoading] = useState(true)
  const [demos, setDemos] = useState<Demo[]>([])
  const [canDelete, setCanDelete] = useState(false)
  const [githubReady, setGithubReady] = useState(true)
  const [banner, setBanner] = useState<Banner>(null)
  const [confirming, setConfirming] = useState<Demo | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [links, setLinks] = useState<LinkRow[]>([])
  const [stats, setStats] = useState<Record<string, DemoStat>>({})
  const [recent, setRecent] = useState<Ev[]>([])
  const [ownVisits, setOwnVisits] = useState(0)
  const [form, setForm] = useState({ slug: '', label: '', note: '' })
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<LinkRow | null>(null)
  const [filter, setFilter] = useState<string>('all') // all | link:<code> | demo:<slug>
  const [showBots, setShowBots] = useState(false)

  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch('/api/demo-links', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setLinks(data.links || []); setStats(data.demos || {}); setRecent(data.recent || []); setOwnVisits(data.ownVisits || 0)
    } catch { /* keep last data */ }
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/demos', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setBanner({ ok: false, text: data.error || 'Could not load demos.' }); return }
      setDemos(data.demos || [])
      setCanDelete(!!data.canDelete)
      setGithubReady(!!data.githubConfigured)
    } catch {
      setBanner({ ok: false, text: 'Could not load demos.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(); loadTracking() }, [load, loadTracking])
  useEffect(() => { const t = setInterval(loadTracking, 30000); return () => clearInterval(t) }, [loadTracking])

  const titleOf = useMemo(() => Object.fromEntries(demos.map(d => [d.slug, d.title.split(/ [—·|-] /)[0]])), [demos])

  async function doDelete() {
    if (!confirming || confirmText !== confirming.slug) return
    setDeleting(true); setBanner(null)
    try {
      const res = await fetch(`/api/demos/${confirming.slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setBanner({ ok: false, text: data.error || 'Delete failed.' }); return }
      const parts = [`"${confirming.title}" deleted`, `${data.gitFiles} files removed from git`, `${data.liveFiles} from the server`]
      if (data.cachePurged) parts.push('Cloudflare cache purged')
      setBanner({ ok: true, text: parts.join(' · ') + (data.warnings?.length ? ` — ${data.warnings.join(' ')}` : '') })
      setConfirming(null); setConfirmText('')
      load()
    } finally {
      setDeleting(false)
    }
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setBanner(null)
    try {
      const res = await fetch('/api/demo-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setBanner({ ok: false, text: data.error || 'Could not create link.' }); return }
      setCreated({ ...data.link, clicks: 0, previews: 0, opens: 0, visitors: 0, totalSeconds: 0, lastAt: null })
      navigator.clipboard?.writeText(goUrl(data.link.code)).catch(() => {})
      setForm(f => ({ ...f, label: '', note: '' }))
      loadTracking()
    } finally {
      setCreating(false)
    }
  }

  async function deleteLink(l: LinkRow) {
    if (!window.confirm(`Delete the tracked link “${l.label}”? The link ${goUrl(l.code)} will stop working (it will redirect to your portfolio).`)) return
    const res = await fetch(`/api/demo-links/${l.code}`, { method: 'DELETE' })
    if (res.ok) { setBanner({ ok: true, text: `Link “${l.label}” deleted.` }); loadTracking() }
    else setBanner({ ok: false, text: 'Could not delete the link.' })
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setBanner({ ok: true, text: `Link copied: ${text}` })
  }

  const feed = recent.filter(e =>
    (showBots || !e.bot) &&
    (filter === 'all' || (filter.startsWith('link:') && e.code === filter.slice(5)) || (filter.startsWith('demo:') && e.slug === filter.slice(5))))

  const weekAgo = Date.now() - 7 * 864e5
  const human = recent.filter(e => !e.bot)
  const opens7 = Object.values(stats).reduce((n, s) => n + s.opens7d, 0)
  const visitors7 = new Set(human.filter(e => new Date(e.t).getTime() >= weekAgo).map(e => e.vid)).size
  const lastHuman = human[0]?.t || null

  if (loading) {
    return <PortalLayout requiredRole="admin"><div className="p-8 flex justify-center"><Spinner size="lg" /></div></PortalLayout>
  }

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Demo Offers</h1>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs">{demos.length} live demos</span>
        </div>

        <Alert type="info" message="Pitch sites made for prospective clients, served at /demos/<name>/. Send clients a tracked link (below) to see who opened it, when, from where and for how long. Your own visits while logged in are not counted." />
        {!githubReady && canDelete && (
          <Alert type="warning" message="GitHub is not configured on the server (GITHUB_TOKEN, GITHUB_REPO in .env.production), so deleting is disabled." />
        )}
        {banner && <Alert type={banner.ok ? 'success' : 'error'} message={banner.text} />}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Demo opens · 7 days', opens7],
            ['Unique visitors · 7 days', visitors7],
            ['Tracked links', links.length],
            ['Last client activity', ago(lastHuman)],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-800">{v}</div>
              <div className="text-xs text-slate-500 mt-1">{k}</div>
            </div>
          ))}
        </div>

        {/* Create tracked link */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-1">Create a tracked link</h2>
          <p className="text-sm text-slate-500 mb-4">One link per client or bid. Paste it in your proposal instead of the plain demo URL.</p>
          <form onSubmit={createLink} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1.2fr_auto] gap-3 items-end">
            <label className="text-xs font-semibold text-slate-500">Demo
              <select required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 bg-white text-slate-800 font-normal">
                <option value="">Choose a demo…</option>
                {demos.map(d => <option key={d.slug} value={d.slug}>{titleOf[d.slug]} ({d.slug})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">Client / project
              <input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} maxLength={120}
                placeholder="e.g. Freelancer — delivery cafe website"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-normal text-slate-800" />
            </label>
            <label className="text-xs font-semibold text-slate-500">Note (optional)
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} maxLength={300}
                placeholder="Project URL, budget, bid amount…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-normal text-slate-800" />
            </label>
            <button disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 h-[38px]">
              {creating ? 'Creating…' : 'Create link'}
            </button>
          </form>
          {created && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <span className="text-sm text-green-800">Link for <b>{created.label}</b> (copied):</span>
              <code className="text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded border border-green-200 break-all">{goUrl(created.code)}</code>
              <button onClick={() => copy(goUrl(created.code))} className="text-xs font-semibold text-green-700 hover:underline">Copy again</button>
            </div>
          )}
        </section>

        {/* Tracked links */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-4">Tracked links</h2>
          {links.length === 0 ? (
            <EmptyState title="No tracked links yet" description="Create one above for each client or bid you send a demo to." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Client / project</th>
                    <th className="py-2 pr-3">Demo</th>
                    <th className="py-2 pr-3 text-right" title="Human clicks on the link">Clicks</th>
                    <th className="py-2 pr-3 text-right" title="Demo actually loaded in a browser">Opens</th>
                    <th className="py-2 pr-3 text-right">Visitors</th>
                    <th className="py-2 pr-3 text-right">Time spent</th>
                    <th className="py-2 pr-3">Last activity</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(l => {
                    const seen = l.clicks + l.opens > 0
                    return (
                      <tr key={l.code} className="border-b border-slate-50 align-top">
                        <td className="py-3 pr-3">
                          <div className="font-medium text-slate-700 flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${seen ? 'bg-green-500' : 'bg-slate-300'}`} title={seen ? 'Opened' : 'Not opened yet'} />
                            {l.label}
                          </div>
                          {l.note && <div className="text-xs text-slate-400 mt-0.5 break-all">{l.note}</div>}
                          <div className="text-xs text-slate-400 font-mono mt-0.5">/go/{l.code} · created {new Date(l.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-xs">{titleOf[l.slug] || l.slug}</td>
                        <td className="py-3 pr-3 text-right font-semibold text-slate-800">
                          {l.clicks}
                          {l.previews > 0 && <div className="text-[11px] font-normal text-slate-400" title="Link previews fetched by apps (WhatsApp, Freelancer, Slack…) — not people">+{l.previews} preview</div>}
                        </td>
                        <td className="py-3 pr-3 text-right font-semibold text-slate-800">{l.opens}</td>
                        <td className="py-3 pr-3 text-right text-slate-600">{l.visitors}</td>
                        <td className="py-3 pr-3 text-right text-slate-600 whitespace-nowrap">{dur(l.totalSeconds)}</td>
                        <td className="py-3 pr-3 text-xs whitespace-nowrap">
                          <span className={seen ? 'text-green-700 font-semibold' : 'text-slate-400'}>{seen ? ago(l.lastAt) : 'Not opened yet'}</span>
                        </td>
                        <td className="py-3 pr-3 text-right whitespace-nowrap">
                          <button onClick={() => copy(goUrl(l.code))} className="text-xs text-blue-600 hover:underline mr-3">Copy link</button>
                          <button onClick={() => setFilter(`link:${l.code}`)} className="text-xs text-slate-500 hover:text-slate-700 mr-3">Activity</button>
                          <button onClick={() => deleteLink(l)} className="text-xs text-red-600 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Activity feed */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-bold text-slate-800">Activity</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs text-slate-500 flex items-center gap-1.5">
                <input type="checkbox" checked={showBots} onChange={e => setShowBots(e.target.checked)} /> Show link previews
              </label>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white">
                <option value="all">All demos &amp; links</option>
                <optgroup label="Tracked links">
                  {links.map(l => <option key={l.code} value={`link:${l.code}`}>{l.label}</option>)}
                </optgroup>
                <optgroup label="Demos">
                  {demos.map(d => <option key={d.slug} value={`demo:${d.slug}`}>{titleOf[d.slug]}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          {feed.length === 0 ? (
            <EmptyState title="No activity yet" description="Opens and clicks appear here within seconds. Refreshes every 30 seconds." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">What</th>
                    <th className="py-2 pr-3">Link / demo</th>
                    <th className="py-2 pr-3">From</th>
                    <th className="py-2 pr-3">Visitor</th>
                    <th className="py-2 pr-3 text-right">Time on demo</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.slice(0, 150).map(e => (
                    <tr key={e.id} className={`border-b border-slate-50 ${e.bot ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <div className="text-slate-700 text-xs font-medium">{ago(e.t)}</div>
                        <div className="text-[11px] text-slate-400">{new Date(e.t).toLocaleString()}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${e.bot ? 'bg-slate-100 text-slate-500' : e.type === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {e.bot ? 'Link preview' : e.type === 'open' ? 'Opened demo' : 'Clicked link'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        <div className="text-slate-700 font-medium">{e.label || <span className="text-slate-400 font-normal">Direct (untracked)</span>}</div>
                        <div className="text-slate-400">{titleOf[e.slug] || e.slug}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-600">{e.referrer || <span className="text-slate-400">—</span>}</td>
                      <td className="py-2.5 pr-3 text-xs text-slate-600 whitespace-nowrap">
                        <span title={e.country || 'Unknown country'}>{flag(e.country)} {e.country || ''}</span> · {e.device} · {e.browser} · {e.os}
                        <div className="text-[11px] text-slate-400 font-mono">visitor {e.vid.slice(0, 6)}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-xs text-slate-600 whitespace-nowrap">
                        {e.type === 'open' ? <>{dur(e.dur)}{(e.pages || 0) > 1 && <div className="text-[11px] text-slate-400">{e.pages} pages</div>}</> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ownVisits > 0 && <p className="text-xs text-slate-400 mt-3">{ownVisits} of your own visits (logged in as admin) are hidden.</p>}
            </div>
          )}
        </section>

        {/* Demos */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-4">Demos</h2>
          {demos.length === 0 ? (
            <EmptyState title="No demos" description="Demos added to the demos/ folder in git appear here after a deploy." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Demo</th>
                    <th className="py-2 pr-3">Link</th>
                    <th className="py-2 pr-3 text-right">Opens · 7d / all</th>
                    <th className="py-2 pr-3">Last opened</th>
                    <th className="py-2 pr-3">Files</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demos.map(d => {
                    const s = stats[d.slug]
                    return (
                      <tr key={d.slug} className="border-b border-slate-50">
                        <td className="py-3 pr-3">
                          <div className="font-medium text-slate-700">{d.title}</div>
                          <div className="text-xs text-slate-400 font-mono">{d.slug}{!d.tracked && <span className="ml-2 text-amber-600 font-sans" title="index.html does not load /demo-beacon.js">· opens not tracked</span>}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{d.url}</a>
                        </td>
                        <td className="py-3 pr-3 text-right text-slate-700 whitespace-nowrap">
                          <b>{s?.opens7d || 0}</b> / {s?.opens || 0}
                          {s?.visitors ? <div className="text-[11px] text-slate-400">{s.visitors} visitors</div> : null}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-xs whitespace-nowrap">{ago(s?.lastAt || null)}</td>
                        <td className="py-3 pr-3 text-slate-600 text-xs whitespace-nowrap">{d.files} · {formatSize(d.bytes)}</td>
                        <td className="py-3 pr-3 text-right whitespace-nowrap">
                          <button onClick={() => { setForm(f => ({ ...f, slug: d.slug })); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className="text-xs font-semibold text-blue-600 hover:underline mr-3">
                            New tracked link
                          </button>
                          <button onClick={() => setFilter(`demo:${d.slug}`)} className="text-xs text-slate-500 hover:text-slate-700 mr-3">Activity</button>
                          <button onClick={() => copy(d.url)} className="text-xs text-slate-500 hover:text-slate-700 mr-3">
                            Copy link
                          </button>
                          {canDelete && (
                            <button onClick={() => { setConfirming(d); setConfirmText('') }} disabled={!githubReady}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40">
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !deleting && setConfirming(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-slate-800 text-lg">Delete “{confirming.title}”?</h2>
            <p className="text-sm text-slate-600">
              This permanently removes all {confirming.files} files from git, the server and the Cloudflare cache.
              The link <span className="font-mono text-xs">{confirming.url}</span> will stop working.
            </p>
            <label className="block text-sm text-slate-600">
              Type <span className="font-mono font-semibold text-slate-800">{confirming.slug}</span> to confirm
              <input autoFocus className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 font-mono"
                value={confirmText} onChange={e => setConfirmText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doDelete() }} />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirming(null)} disabled={deleting} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={doDelete} disabled={deleting || confirmText !== confirming.slug}
                className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
