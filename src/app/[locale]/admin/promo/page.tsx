'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert } from '@/components/ui'

type Offer = { label: string; oldPrice: string; newPrice: string; unit: string; discount: string }
type Form = {
  enabled: boolean
  badge: string
  titleLead: string
  titleHighlight: string
  titleTrail: string
  subtitle: string
  offers: Offer[]
  features: string[]
  ctaLabel: string
  ctaHref: string
}

const EMPTY_OFFER: Offer = { label: '', oldPrice: '', newPrice: '', unit: '', discount: '' }

export default function AdminPromo() {
  const [region, setRegion] = useState<'us' | 'mk'>('us')
  const [form, setForm] = useState<Form | null>(null)
  const [featuresText, setFeaturesText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/promo-popup?region=${region}`, { cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      setForm({
        enabled: !!d.enabled,
        badge: d.badge || '',
        titleLead: d.titleLead || '',
        titleHighlight: d.titleHighlight || '',
        titleTrail: d.titleTrail || '',
        subtitle: d.subtitle || '',
        offers: (d.offers || []).map((o: Offer) => ({ ...EMPTY_OFFER, ...o })),
        features: d.features || [],
        ctaLabel: d.ctaLabel || '',
        ctaHref: d.ctaHref || '',
      })
      setFeaturesText((d.features || []).join('\n'))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [region])

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(f => (f ? { ...f, [key]: value } : f))
  }
  function setOffer(i: number, key: keyof Offer, value: string) {
    setForm(f => {
      if (!f) return f
      const offers = f.offers.map((o, idx) => (idx === i ? { ...o, [key]: value } : o))
      return { ...f, offers }
    })
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setBanner(null)
    const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4)
    const res = await fetch(`/api/promo-popup?region=${region}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, features }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setBanner({ ok: true, text: `Popup for ${region === 'mk' ? 'Macedonian' : 'English'} saved. It's live on the site immediately.` })
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to save' })
    }
    setSaving(false)
  }

  const label = region === 'mk' ? 'Macedonian (ag-development.dev/mk)' : 'English (ag-development.dev/en)'

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Promo Popup</h1>
          <p className="text-slate-500 text-sm mt-1">Turn the homepage special-offer popup on or off and edit its content — separately for the English and Macedonian site.</p>
        </div>

        {banner && <div className="mb-5"><Alert type={banner.ok ? 'success' : 'error'} message={banner.text} /></div>}

        {/* Region toggle */}
        <div className="card px-5 py-3.5 mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Language / version</span>
          {(['us', 'mk'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                region === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {r === 'us' ? '🇬🇧 English' : '🇲🇰 Macedonian'}
            </button>
          ))}
        </div>

        {loading || !form ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card p-6 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>

            {/* Enable / disable */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} />
              <span>
                <span className="text-sm font-semibold text-slate-700">Show this popup on the site</span>
                <span className="block text-xs text-slate-400">When off, visitors to this version won&apos;t see the popup at all.</span>
              </span>
            </label>

            <div>
              <label className="form-label">Badge text</label>
              <input className="form-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. Limited offer" />
            </div>

            <div>
              <label className="form-label">Title</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="form-input" value={form.titleLead} onChange={e => set('titleLead', e.target.value)} placeholder="Start — e.g. Get " />
                <input className="form-input" value={form.titleHighlight} onChange={e => set('titleHighlight', e.target.value)} placeholder="Highlight — e.g. 50% off" />
                <input className="form-input" value={form.titleTrail} onChange={e => set('titleTrail', e.target.value)} placeholder="End — e.g. your new website" />
              </div>
              <p className="text-xs text-slate-400 mt-1">The middle part shows in the blue/purple gradient. Reads as one sentence: <span className="font-medium text-slate-500">{(form.titleLead + form.titleHighlight + form.titleTrail).trim() || '…'}</span></p>
            </div>

            <div>
              <label className="form-label">Subtitle</label>
              <textarea className="form-input min-h-16 resize-y" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
            </div>

            {/* Offers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label mb-0">Offers</label>
                {form.offers.length < 3 && (
                  <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={() => set('offers', [...form.offers, { ...EMPTY_OFFER }])}>+ Add offer</button>
                )}
              </div>
              <div className="space-y-3">
                {form.offers.map((o, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-3 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500">Offer {i + 1}</span>
                      <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => set('offers', form.offers.filter((_, idx) => idx !== i))}>Remove</button>
                    </div>
                    <input className="form-input mb-2" value={o.label} onChange={e => setOffer(i, 'label', e.target.value)} placeholder="Label — e.g. Website build (Business Site)" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input className="form-input" value={o.oldPrice} onChange={e => setOffer(i, 'oldPrice', e.target.value)} placeholder="Old price — $250" />
                      <input className="form-input" value={o.newPrice} onChange={e => setOffer(i, 'newPrice', e.target.value)} placeholder="New price — $125" />
                      <input className="form-input" value={o.unit} onChange={e => setOffer(i, 'unit', e.target.value)} placeholder="Unit — /mo or one-time" />
                      <input className="form-input" value={o.discount} onChange={e => setOffer(i, 'discount', e.target.value)} placeholder="Badge — -50%" />
                    </div>
                  </div>
                ))}
                {form.offers.length === 0 && <p className="text-xs text-slate-400">No offers — add one, or leave empty to hide the price rows.</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Feature pills — one per line (up to 4)</label>
              <textarea
                className="form-input min-h-28 resize-y font-mono text-xs"
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder={'Modern design\nMobile-friendly\nBetter visibility\nReliable support'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Button text</label>
                <input className="form-input" value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} placeholder="Claim 50% off →" />
              </div>
              <div>
                <label className="form-label">Button link</label>
                <input className="form-input" value={form.ctaHref} onChange={e => set('ctaHref', e.target.value)} placeholder="/contact or /pricing" />
                <p className="text-xs text-slate-400 mt-1">Path only (the language prefix is added automatically). e.g. <code>/contact</code>, <code>/pricing</code>.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
              >
                {saving ? <><Spinner size="sm" /> Saving…</> : 'Save popup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
