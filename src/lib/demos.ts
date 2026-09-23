// Client pitch demos (static sites under /demos/<slug>/).
//
// Source of truth is the `demos/` folder in git. On deploy, deploy.sh syncs it
// into a host folder that Caddy serves directly and the app container mounts
// read-write (DEMOS_DIR). Deleting a demo removes it everywhere at once:
//   1. git     — a commit on GitHub removes demos/<slug>/ (so no deploy restores it)
//   2. server  — the live files are removed from DEMOS_DIR (404 immediately)
//   3. cache   — Cloudflare edge cache is purged for every URL of the demo
import { promises as fs } from 'fs'
import path from 'path'

export const DEMOS_DIR = process.env.DEMOS_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'demos')
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://ag-development.dev').replace(/\/$/, '')
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/

export type DemoInfo = {
  slug: string
  title: string
  url: string
  files: number
  bytes: number
  updatedAt: string
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

function demoPath(slug: string): string {
  if (!isValidSlug(slug)) throw new Error('Invalid demo name')
  const p = path.resolve(/*turbopackIgnore: true*/ DEMOS_DIR, slug)
  if (path.dirname(p) !== path.resolve(/*turbopackIgnore: true*/ DEMOS_DIR)) throw new Error('Invalid demo name')
  return p
}

async function walk(dir: string, base = ''): Promise<{ rel: string; size: number; mtime: number }[]> {
  const out: { rel: string; size: number; mtime: number }[] = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    const full = path.join(/*turbopackIgnore: true*/ dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full, rel))
    else if (entry.isFile()) {
      const st = await fs.stat(full)
      out.push({ rel, size: st.size, mtime: st.mtimeMs })
    }
  }
  return out
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

export async function listDemos(): Promise<DemoInfo[]> {
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(DEMOS_DIR, { withFileTypes: true })
  } catch {
    return []
  }
  const demos: DemoInfo[] = []
  for (const e of entries) {
    if (!e.isDirectory() || !isValidSlug(e.name)) continue
    const dir = path.join(/*turbopackIgnore: true*/ DEMOS_DIR, e.name)
    const files = await walk(dir)
    let title = e.name
    try {
      const html = await fs.readFile(path.join(/*turbopackIgnore: true*/ dir, 'index.html'), 'utf8')
      const m = html.match(/<title>([\s\S]*?)<\/title>/i)
      if (m) title = decodeEntities(m[1].trim())
    } catch { /* no index.html */ }
    demos.push({
      slug: e.name,
      title,
      url: `${SITE_URL}/demos/${e.name}/`,
      files: files.length,
      bytes: files.reduce((n, f) => n + f.size, 0),
      updatedAt: new Date(Math.max(0, ...files.map(f => f.mtime))).toISOString(),
    })
  }
  return demos.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

// ── GitHub: remove demos/<slug>/ from the branch in a single commit ────────────

function githubConfig() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  return token && repo ? { token, repo, branch } : null
}

export function githubConfigured(): boolean {
  return githubConfig() !== null
}

async function gh(pathname: string, init?: RequestInit) {
  const cfg = githubConfig()!
  const res = await fetch(`https://api.github.com/repos/${cfg.repo}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(`GitHub ${res.status}: ${data.message || 'request failed'}`), { status: res.status })
  return data
}

async function deleteFromGit(slug: string, actor: string): Promise<number> {
  const { branch } = githubConfig()!
  // Retry once if the branch moved between reading and updating it.
  for (let attempt = 0; ; attempt++) {
    const ref = await gh(`/git/ref/heads/${branch}`)
    const headSha: string = ref.object.sha
    const commit = await gh(`/git/commits/${headSha}`)
    const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`)
    if (tree.truncated) throw new Error('GitHub tree too large to edit safely')

    const prefix = `demos/${slug}/`
    const files = (tree.tree as { path: string; mode: string; type: string }[])
      .filter(t => t.type === 'blob' && t.path.startsWith(prefix))
    if (!files.length) return 0

    const newTree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: files.map(f => ({ path: f.path, mode: f.mode, type: 'blob', sha: null })),
      }),
    })
    const newCommit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: `Delete demo ${slug} (via admin, ${actor})`, tree: newTree.sha, parents: [headSha] }),
    })
    try {
      await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) })
      return files.length
    } catch (err: any) {
      if (err.status === 422 && attempt === 0) continue
      throw err
    }
  }
}

// ── Cloudflare: purge the edge cache for every URL of the demo ─────────────────

function cloudflareConfig() {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const zone = process.env.CLOUDFLARE_ZONE_ID
  return token && zone ? { token, zone } : null
}

async function purgeCloudflare(urls: string[]): Promise<boolean> {
  const cfg = cloudflareConfig()
  if (!cfg) return false
  for (let i = 0; i < urls.length; i += 30) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfg.zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: urls.slice(i, i + 30) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(`Cloudflare purge failed: ${data.errors?.[0]?.message || res.status}`)
  }
  return true
}

export type DeleteResult = { gitFiles: number; liveFiles: number; cachePurged: boolean; warnings: string[] }

export async function deleteDemo(slug: string, actor: string): Promise<DeleteResult> {
  const dir = demoPath(slug)
  const warnings: string[] = []

  let files: { rel: string }[] = []
  try { files = await walk(dir) } catch { /* not live on this server */ }

  // Git first: if this fails nothing is removed, so the demo can't come back on the next deploy.
  const gitFiles = await deleteFromGit(slug, actor)

  await fs.rm(dir, { recursive: true, force: true })

  const base = `${SITE_URL}/demos/${slug}/`
  const urls = [base, `${SITE_URL}/demos/${slug}`, ...files.map(f => base + f.rel.split('/').map(encodeURIComponent).join('/'))]
  let cachePurged = false
  try {
    cachePurged = await purgeCloudflare(urls)
    if (!cachePurged) warnings.push('Cloudflare is not configured, so the edge cache was not purged. Demo files are sent with no-store, so Cloudflare should not have cached them.')
  } catch (err: any) {
    warnings.push(err.message)
  }

  return { gitFiles, liveFiles: files.length, cachePurged, warnings }
}
