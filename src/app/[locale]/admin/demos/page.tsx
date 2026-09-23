'use client'

import { useState, useEffect, useCallback } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert, EmptyState } from '@/components/ui'

type Demo = {
  slug: string
  title: string
  url: string
  files: number
  bytes: number
  updatedAt: string
}

type Banner = { ok: boolean; text: string } | null

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DemosPage() {
  const [loading, setLoading] = useState(true)
  const [demos, setDemos] = useState<Demo[]>([])
  const [canDelete, setCanDelete] = useState(false)
  const [githubReady, setGithubReady] = useState(true)
  const [banner, setBanner] = useState<Banner>(null)
  const [confirming, setConfirming] = useState<Demo | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => { load() }, [load])

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

        <Alert type="info" message="Pitch sites made for prospective clients, served at /demos/<name>/. Keep a demo while the client decides — if they buy, it is developed further from git. Deleting removes it from git, the server and the Cloudflare cache, and cannot be undone." />
        {!githubReady && canDelete && (
          <Alert type="warning" message="GitHub is not configured on the server (GITHUB_TOKEN, GITHUB_REPO in .env.production), so deleting is disabled." />
        )}
        {banner && <Alert type={banner.ok ? 'success' : 'error'} message={banner.text} />}

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          {demos.length === 0 ? (
            <EmptyState title="No demos" description="Demos added to the demos/ folder in git appear here after a deploy." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Demo</th>
                    <th className="py-2 pr-3">Link</th>
                    <th className="py-2 pr-3">Files</th>
                    <th className="py-2 pr-3">Updated</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demos.map(d => (
                    <tr key={d.slug} className="border-b border-slate-50">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-slate-700">{d.title}</div>
                        <div className="text-xs text-slate-400 font-mono">{d.slug}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{d.url}</a>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 text-xs whitespace-nowrap">{d.files} · {formatSize(d.bytes)}</td>
                      <td className="py-3 pr-3 text-slate-600 text-xs whitespace-nowrap">{new Date(d.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-3 text-right whitespace-nowrap">
                        <button onClick={() => { navigator.clipboard.writeText(d.url); setBanner({ ok: true, text: `Link copied: ${d.url}` }) }}
                          className="text-xs text-slate-500 hover:text-slate-700 mr-3">
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
                  ))}
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
