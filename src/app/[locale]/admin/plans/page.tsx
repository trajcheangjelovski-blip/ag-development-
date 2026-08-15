'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner, Alert } from '@/components/ui'
import { formatPrice } from '@/lib/money'

type Plan = {
  id: string
  name: string
  description: string
  category: string
  price: number
  billing_interval: 'month' | null
  sale_price: number | null
  sale_active: boolean
  is_active: boolean
  effective_price: number
  badge: string | null
  features: string[] | null
  details: { label: string; value: string }[] | null
  good_for: string | null
  delivery: string | null
  grant_type: 'hours' | 'tickets' | 'items' | null
  grant_qty: number
}

type Coupon = {
  id: string
  code: string
  percent_off: number | null
  amount_off: number | null
  is_active: boolean
  expires_at: string | null
  max_redemptions: number | null
  redemptions: number
}

type SupportPackage = {
  id: string
  name: string
  price: number
  requests_per_month: number
  hours_per_month: number
  response_time: string
  extra_hourly_rate: number
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [packages, setPackages] = useState<SupportPackage[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsTableMissing, setCouponsTableMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null)

  // Pricing region for the sellable-plans table: 'us' (USD, `plans`) or 'mk'
  // (denars, `plans_mk`). Coupons and custom packages are region-agnostic.
  const [planRegion, setPlanRegion] = useState<'us' | 'mk'>('us')
  const cur = (n: number) => formatPrice(n, planRegion === 'mk' ? 'MKD' : 'USD', planRegion === 'mk' ? 'mk' : 'en')

  // Plan edit modal
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [featuresText, setFeaturesText] = useState('')
  const [detailsText, setDetailsText] = useState('')
  const [planSaving, setPlanSaving] = useState(false)

  function openPlanEditor(p: Plan) {
    setEditPlan({ ...p })
    setFeaturesText((p.features || []).join('\n'))
    setDetailsText((p.details || []).map(d => `${d.label} | ${d.value}`).join('\n'))
  }

  // Coupon create form
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: '', expires_at: '', max_redemptions: '' })
  const [couponSaving, setCouponSaving] = useState(false)

  // Custom package builder
  const [showPkgForm, setShowPkgForm] = useState(false)
  const [pkgForm, setPkgForm] = useState({ name: '', price: '', hours_per_month: '', requests_per_month: '', response_time: '24 hours', extra_hourly_rate: '10', description: '', team_enabled: false, team_seats: '', setup_fee: '' })
  const [pkgSaving, setPkgSaving] = useState(false)
  const [combo, setCombo] = useState<{ build: string; care: string; it: string; social: string }>({ build: '', care: '', it: '', social: '' })
  const [extraQty, setExtraQty] = useState<Record<string, number>>({})
  const [oneTime, setOneTime] = useState(0)        // live one-time total for the builder
  const [nameTouched, setNameTouched] = useState(false) // stop auto-overwriting once edited
  const [editPkg, setEditPkg] = useState<any | null>(null) // existing custom plan being edited
  const [pkgEditSaving, setPkgEditSaving] = useState(false)

  // New extra form
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraForm, setExtraForm] = useState({ name: '', price: '', interval: 'one-time', grant_type: 'items', grant_qty: '1' })
  const [extraSaving, setExtraSaving] = useState(false)

  // Filter for the client plans table
  const [pkgFilter, setPkgFilter] = useState<'all' | 'monthly' | 'one-time'>('all')

  // Monthly credits granted by each base plan (requests, hours)
  const CREDIT_MAP: Record<string, { r: number; h: number }> = {
    'basic-care': { r: 1, h: 0 }, 'content-care': { r: 3, h: 0.5 }, 'growth-care': { r: 5, h: 1 }, 'full-care': { r: 8, h: 2 },
    'it-basic': { r: 3, h: 2 }, 'it-team': { r: 8, h: 5 }, 'it-office': { r: 15, h: 10 },
    'social-starter': { r: 2, h: 0 }, 'social-business': { r: 7, h: 0 }, 'social-growth': { r: 14, h: 0 },
  }

  function applyCombo(nextCombo: typeof combo, nextExtras: Record<string, number>) {
    setCombo(nextCombo)
    setExtraQty(nextExtras)

    const byId = (id: string) => plans.find(p => p.id === id)
    const selected = [nextCombo.build, nextCombo.care, nextCombo.it, nextCombo.social].filter(Boolean).map(byId).filter(Boolean) as Plan[]
    const extras = Object.entries(nextExtras).filter(([, q]) => q > 0)

    let monthly = 0
    let oneTime = 0
    let requests = 0
    let hours = 0
    const parts: string[] = []

    for (const p of selected) {
      const price = p.sale_active && p.sale_price != null ? p.sale_price : p.price
      if (p.billing_interval === 'month') monthly += price
      else oneTime += price
      const c = CREDIT_MAP[p.id]
      if (c) { requests += c.r; hours += c.h }
      parts.push(p.name)
    }
    // Extras are tracked separately on the client's ledger — they add to the
    // price here, but not to the base monthly credits.
    for (const [id, qty] of extras) {
      const p = byId(id)
      if (!p) continue
      const price = (p.sale_active && p.sale_price != null ? p.sale_price : p.price) * qty
      if (p.billing_interval === 'month') monthly += price
      else oneTime += price
      parts.push(`${qty}× ${p.name}`)
    }

    setOneTime(oneTime)
    setPkgForm(f => ({
      ...f,
      // Don't overwrite a name the admin has typed themselves
      name: nameTouched ? f.name : (parts.length ? `Custom: ${parts.join(' + ')}`.slice(0, 90) : f.name),
      price: String(monthly),
      setup_fee: String(oneTime),
      requests_per_month: String(requests),
      hours_per_month: String(hours),
      description: [
        parts.length ? `Includes: ${parts.join(', ')}` : '',
        oneTime > 0 ? `One-time setup: $${oneTime} (invoice separately)` : '',
      ].filter(Boolean).join('\n'),
    }))
  }

  // Structured extras for the package being built (saved + used to auto-create
  // the client's tracking ledger when the plan is assigned)
  function buildExtrasPayload() {
    return Object.entries(extraQty)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => {
        const p = plans.find(x => x.id === id)
        if (!p) return null
        return {
          id: p.id,
          name: p.name,
          qty,
          grant_type: p.grant_type || 'items',
          grant_qty: p.grant_qty || 1,
        }
      })
      .filter(Boolean)
  }

  async function loadAll() {
    const [plansRes, couponsRes, pkgRes] = await Promise.all([
      fetch(`/api/plans?all=1&region=${planRegion}`),
      fetch('/api/coupons'),
      fetch('/api/packages'),
    ])
    if (plansRes.ok) setPlans(await plansRes.json())
    if (pkgRes.ok) setPackages(await pkgRes.json())
    if (couponsRes.ok) {
      const data = await couponsRes.json()
      setCoupons(data.coupons || [])
      setCouponsTableMissing(!!data.tableMissing)
    }
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [planRegion])

  async function savePlan() {
    if (!editPlan) return
    setPlanSaving(true)
    setBanner(null)
    const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean)
    const details = detailsText
      .split('\n')
      .map(line => {
        const i = line.indexOf('|')
        if (i === -1) return null
        return { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
      })
      .filter((d): d is { label: string; value: string } => !!d && !!d.label && !!d.value)

    const res = await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editPlan, features, details, region: planRegion }),
    })
    const data = await res.json()
    if (res.ok) {
      setBanner({ ok: true, text: `"${editPlan.name}" saved. Changes are live on the website immediately.` })
      setEditPlan(null)
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to save plan' })
    }
    setPlanSaving(false)
  }

  async function deletePlan(p: Plan) {
    if (!confirm(`Delete "${p.name}"? This permanently removes the item. Existing client records keep their copy.`)) return
    setBanner(null)
    const res = await fetch(`/api/plans?id=${encodeURIComponent(p.id)}&region=${planRegion}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setBanner({ ok: true, text: `"${p.name}" deleted.` })
      if (editPlan?.id === p.id) setEditPlan(null)
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to delete' })
    }
  }

  async function createCoupon() {
    setCouponSaving(true)
    setBanner(null)
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: couponForm.code,
        percent_off: couponForm.type === 'percent' ? couponForm.value : null,
        amount_off: couponForm.type === 'amount' ? couponForm.value : null,
        expires_at: couponForm.expires_at || null,
        max_redemptions: couponForm.max_redemptions || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setBanner({ ok: true, text: `Coupon ${data.code} created.` })
      setShowCouponForm(false)
      setCouponForm({ code: '', type: 'percent', value: '', expires_at: '', max_redemptions: '' })
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to create coupon' })
    }
    setCouponSaving(false)
  }

  async function toggleCoupon(c: Coupon) {
    await fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    })
    loadAll()
  }

  async function deleteCoupon(c: Coupon) {
    await fetch(`/api/coupons?id=${c.id}`, { method: 'DELETE' })
    loadAll()
  }

  async function createPackage() {
    setPkgSaving(true)
    setBanner(null)
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pkgForm.name,
        price: Number(pkgForm.price),
        hours_per_month: pkgForm.hours_per_month,
        requests_per_month: pkgForm.requests_per_month,
        response_time: pkgForm.response_time,
        extra_hourly_rate: pkgForm.extra_hourly_rate,
        description: pkgForm.description,
        team_enabled: pkgForm.team_enabled,
        team_seats: pkgForm.team_seats,
        setup_fee: pkgForm.setup_fee,
        extras: buildExtrasPayload(),
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setBanner({ ok: true, text: `Custom plan "${data.name}" created. Assign it to a client via Clients → Edit Client.` })
      setShowPkgForm(false)
      setPkgForm({ name: '', price: '', hours_per_month: '', requests_per_month: '', response_time: '24 hours', extra_hourly_rate: '10', description: '', team_enabled: false, team_seats: '', setup_fee: '' })
      setCombo({ build: '', care: '', it: '', social: '' })
      setExtraQty({})
      setOneTime(0)
      setNameTouched(false)
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to create package' })
    }
    setPkgSaving(false)
  }

  async function savePkg() {
    if (!editPkg) return
    setPkgEditSaving(true)
    setBanner(null)
    const res = await fetch('/api/packages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editPkg.id,
        name: editPkg.name,
        price: editPkg.price,
        setup_fee: editPkg.setup_fee,
        hours_per_month: editPkg.hours_per_month,
        requests_per_month: editPkg.requests_per_month,
        response_time: editPkg.response_time,
        extra_hourly_rate: editPkg.extra_hourly_rate,
        description: editPkg.description,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setBanner({ ok: true, text: `"${editPkg.name}" updated.` }); setEditPkg(null); loadAll() }
    else setBanner({ ok: false, text: data?.error || 'Failed to update plan' })
    setPkgEditSaving(false)
  }

  async function updateTeam(p: any, patch: { team_enabled?: boolean; team_seats?: number | null }) {
    setBanner(null)
    const res = await fetch('/api/packages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, ...patch }),
    })
    if (res.ok) loadAll()
    else setBanner({ ok: false, text: 'Failed to update team setting' })
  }

  async function deletePackage(p: SupportPackage) {
    if (!window.confirm(`Delete the plan "${p.name}"? Clients still assigned to it will keep it, but it will be hidden from the dropdown.`)) return
    setBanner(null)
    const res = await fetch(`/api/packages?id=${p.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setBanner({ ok: true, text: data.deactivated ? data.message : `"${p.name}" deleted.` })
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to delete plan' })
    }
  }

  async function createExtra() {
    if (!extraForm.name.trim() || !extraForm.price) return
    setExtraSaving(true)
    setBanner(null)
    const id = 'extra-' + extraForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^extra-/, '').slice(0, 40)
    const res = await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: extraForm.name.trim(),
        description: '',
        category: 'Extras',
        price: Number(extraForm.price),
        billing_interval: extraForm.interval === 'monthly' ? 'month' : null,
        is_active: true,
        sort: 100,
        grant_type: extraForm.grant_type,
        grant_qty: Number(extraForm.grant_qty) || 1,
        region: planRegion,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setBanner({ ok: true, text: `Extra "${data.name}" created.` })
      setShowExtraForm(false)
      setExtraForm({ name: '', price: '', interval: 'one-time', grant_type: 'items', grant_qty: '1' })
      loadAll()
    } else {
      setBanner({ ok: false, text: data?.error || 'Failed to create extra' })
    }
    setExtraSaving(false)
  }

  const categories = Array.from(new Set(plans.map(p => p.category)))

  if (loading) return <PortalLayout requiredRole="admin"><div className="flex justify-center py-20"><Spinner size="lg" /></div></PortalLayout>

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Plans & Coupons</h1>
          <p className="text-slate-500 text-sm mt-1">Edit prices and descriptions, run sales, create discount coupons, and build custom client plans.</p>
        </div>

        {banner && (
          <div className="mb-5">
            <Alert type={banner.ok ? 'success' : 'error'} message={banner.text} />
          </div>
        )}

        {/* ── Region toggle (sellable plans pricing) ── */}
        <div className="card px-5 py-3.5 mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Pricing region</span>
          {(['us', 'mk'] as const).map(r => (
            <button
              key={r}
              onClick={() => setPlanRegion(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                planRegion === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {r === 'us' ? '🇺🇸 US — USD' : '🇲🇰 Macedonia — MKD'}
            </button>
          ))}
          {planRegion === 'mk' && (
            <span className="text-xs text-slate-400 ml-1">Prices shown/entered in denars · Stripe charges the EUR equivalent at checkout. Run <code>regional-pricing.sql</code> first if plans don&apos;t load.</span>
          )}
        </div>

        {/* ── Sellable plans ── */}
        {categories.map(cat => (
          <div key={cat} className="card overflow-hidden mb-5">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-display font-bold text-slate-800 text-sm">{cat}</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {plans.filter(p => p.category === cat).map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                        {p.name}
                        {p.sale_active && p.sale_price != null && <span className="discount-badge">On Sale</span>}
                        {!p.is_active && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Hidden</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 max-w-md truncate">{p.description}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {p.sale_active && p.sale_price != null ? (
                        <>
                          <span className="text-xs text-slate-400 line-through mr-1.5">{cur(p.price)}</span>
                          <span className="font-bold text-slate-800">{cur(p.sale_price)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-800">{cur(p.price)}</span>
                      )}
                      <span className="text-xs text-slate-400">{p.billing_interval ? '/mo' : ' one-time'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right w-28 whitespace-nowrap">
                      <button onClick={() => openPlanEditor(p)} className="text-xs text-blue-600 hover:underline font-medium">Edit →</button>
                      <button onClick={() => deletePlan(p)} className="ml-3 text-xs text-red-600 hover:underline font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))}

        {/* ── Coupons ── */}
        <div className="card overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-800 text-sm">🎟️ Discount Coupons</h2>
            <button onClick={() => setShowCouponForm(v => !v)} className="btn-secondary text-xs px-3 py-1.5">
              {showCouponForm ? 'Cancel' : '+ New Coupon'}
            </button>
          </div>

          {couponsTableMissing && (
            <div className="px-5 py-4 text-sm" style={{ background: '#fffbeb', color: '#92400e' }}>
              One-time setup: run the COUPONS section from <code>supabase/schema.sql</code> in your Supabase SQL editor, then reload.
            </div>
          )}

          {showCouponForm && (
            <div className="px-5 py-4 border-b border-slate-100 bg-blue-50/40">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="form-label">Code</label>
                  <input className="form-input uppercase" placeholder="WELCOME10" value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={couponForm.type} onChange={e => setCouponForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="percent">% off</option>
                    <option value="amount">$ off</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{couponForm.type === 'percent' ? 'Percent' : 'Dollars'}</label>
                  <input type="number" min="1" className="form-input" placeholder={couponForm.type === 'percent' ? '10' : '25'} value={couponForm.value} onChange={e => setCouponForm(p => ({ ...p, value: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Expires (optional)</label>
                  <input type="date" className="form-input" value={couponForm.expires_at} onChange={e => setCouponForm(p => ({ ...p, expires_at: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Max uses (optional)</label>
                  <input type="number" min="1" className="form-input" placeholder="∞" value={couponForm.max_redemptions} onChange={e => setCouponForm(p => ({ ...p, max_redemptions: e.target.value }))} />
                </div>
              </div>
              <button onClick={createCoupon} disabled={couponSaving || !couponForm.code || !couponForm.value} className="btn-primary text-xs px-4 py-2">
                {couponSaving ? 'Creating…' : 'Create Coupon'}
              </button>
            </div>
          )}

          {!coupons.length && !couponsTableMissing ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No coupons yet. Create one to offer discounts at checkout.</div>
          ) : (
            coupons.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0">
                <code className="font-mono font-bold text-sm text-slate-800 flex-shrink-0">{c.code}</code>
                <span className="text-sm text-slate-600 flex-shrink-0">
                  {c.percent_off ? `${c.percent_off}% off` : `$${c.amount_off} off`}
                </span>
                <span className="text-xs text-slate-400 flex-1">
                  Used {c.redemptions}{c.max_redemptions ? `/${c.max_redemptions}` : ''}
                  {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                </span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                  style={c.is_active ? { background: '#dcfce7', color: '#166534' } : { background: '#f1f5f9', color: '#64748b' }}
                >
                  {c.is_active ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => toggleCoupon(c)} className="text-xs text-blue-600 hover:underline flex-shrink-0">
                  {c.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteCoupon(c)} className="text-xs text-red-500 hover:underline flex-shrink-0">Delete</button>
              </div>
            ))
          )}
        </div>

        {/* ── Custom client plans ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-slate-800 text-sm">🧩 Custom Client Plans</h2>
              <p className="text-xs text-slate-400 mt-0.5">Create a tailored support package, then assign it on the client&apos;s page via Edit Client.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowExtraForm(v => !v)} className="btn-ghost text-xs px-3 py-1.5">
                {showExtraForm ? 'Cancel Extra' : '+ New Extra'}
              </button>
              <button onClick={() => setShowPkgForm(v => !v)} className="btn-secondary text-xs px-3 py-1.5">
                {showPkgForm ? 'Cancel Plan' : '+ New Custom Plan'}
              </button>
            </div>
          </div>

          {showExtraForm && (
            <div className="px-5 py-4 border-b border-slate-100" style={{ background: '#fefce8' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New extra (add-on for custom plans)</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="col-span-2">
                  <label className="form-label">Name</label>
                  <input className="form-input" placeholder="e.g. Extra Website Page" value={extraForm.name} onChange={e => setExtraForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Price ($)</label>
                  <input type="number" min="1" className="form-input" placeholder="79" value={extraForm.price} onChange={e => setExtraForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Billing</label>
                  <select className="form-input" value={extraForm.interval} onChange={e => setExtraForm(p => ({ ...p, interval: e.target.value }))}>
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Grants</label>
                  <select className="form-input" value={extraForm.grant_type} onChange={e => setExtraForm(p => ({ ...p, grant_type: e.target.value }))}>
                    <option value="hours">Support hours</option>
                    <option value="tickets">Tickets</option>
                    <option value="items">Deliverables</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Qty per unit</label>
                  <input type="number" min="0.5" step="0.5" className="form-input" value={extraForm.grant_qty} onChange={e => setExtraForm(p => ({ ...p, grant_qty: e.target.value }))} />
                </div>
              </div>
              <button onClick={createExtra} disabled={extraSaving || !extraForm.name || !extraForm.price} className="btn-primary text-xs px-4 py-2 mt-3">
                {extraSaving ? 'Creating…' : 'Create Extra'}
              </button>
              <p className="text-xs text-slate-400 mt-2">Extras appear in the &quot;Extras&quot; section above (editable like any plan) and in the custom plan builder.</p>
            </div>
          )}

          {showPkgForm && (
            <div className="px-5 py-4 bg-blue-50/40">
              {/* Step 1: combine one plan from each category */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1. Combine services (pick any, one per category)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {([
                  ['build', 'New Website', 'Website Build'],
                  ['care', 'Website Maintenance', 'Website Care'],
                  ['it', 'IT Support', 'IT Support'],
                  ['social', 'Design & Social', 'Social Media'],
                ] as const).map(([key, label, category]) => (
                  <div key={key}>
                    <label className="form-label">{label}</label>
                    <select
                      className="form-input"
                      value={combo[key]}
                      onChange={e => applyCombo({ ...combo, [key]: e.target.value }, extraQty)}
                    >
                      <option value="">— None —</option>
                      {plans.filter(p => p.category === category && p.is_active).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.sale_active && p.sale_price != null ? p.sale_price : p.price}{p.billing_interval ? '/mo' : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Step 2: extras */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">2. Add extras</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {plans.filter(p => p.category === 'Extras' && p.is_active).map(p => {
                  const qty = extraQty[p.id] || 0
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">${p.sale_active && p.sale_price != null ? p.sale_price : p.price}{p.billing_interval ? '/mo' : ' each'}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold text-sm" onClick={() => applyCombo(combo, { ...extraQty, [p.id]: Math.max(0, qty - 1) })}>−</button>
                        <span className="w-5 text-center text-sm font-bold text-slate-800">{qty}</span>
                        <button type="button" className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-sm" onClick={() => applyCombo(combo, { ...extraQty, [p.id]: qty + 1 })}>+</button>
                        <button
                          type="button"
                          title="Delete this extra permanently"
                          className="ml-1 w-6 h-6 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-sm"
                          onClick={() => deletePlan(p)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
                {!plans.some(p => p.category === 'Extras' && p.is_active) && (
                  <p className="text-xs text-slate-400 col-span-2">No extras yet — create them with &quot;+ New Extra&quot; below (or run the latest pending-migrations.sql for defaults).</p>
                )}
              </div>

              {/* Step 3: review & adjust */}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">3. Review &amp; adjust</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div className="col-span-2 md:col-span-3">
                  <label className="form-label">Plan name</label>
                  <input className="form-input" placeholder="e.g. Mcash Custom Care" value={pkgForm.name} onChange={e => { setNameTouched(true); setPkgForm(p => ({ ...p, name: e.target.value })) }} />
                </div>
                <div>
                  <label className="form-label">Price ($/month)</label>
                  <input type="number" min="0" className="form-input" placeholder="199" value={pkgForm.price} onChange={e => setPkgForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">One-time setup ($)</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={pkgForm.setup_fee} onChange={e => setPkgForm(p => ({ ...p, setup_fee: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Hours / month</label>
                  <input type="number" min="0" step="0.5" className="form-input" placeholder="3" value={pkgForm.hours_per_month} onChange={e => setPkgForm(p => ({ ...p, hours_per_month: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Requests / month</label>
                  <input type="number" min="0" className="form-input" placeholder="5" value={pkgForm.requests_per_month} onChange={e => setPkgForm(p => ({ ...p, requests_per_month: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Response time</label>
                  <input className="form-input" placeholder="24 hours" value={pkgForm.response_time} onChange={e => setPkgForm(p => ({ ...p, response_time: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Extra rate ($/hr)</label>
                  <input type="number" min="0" className="form-input" placeholder="10" value={pkgForm.extra_hourly_rate} onChange={e => setPkgForm(p => ({ ...p, extra_hourly_rate: e.target.value }))} />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="form-label">What&apos;s included (description)</label>
                  <textarea className="form-input min-h-16 resize-y text-xs" value={pkgForm.description} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="col-span-2 md:col-span-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={pkgForm.team_enabled} onChange={e => setPkgForm(p => ({ ...p, team_enabled: e.target.checked }))} />
                    Allow team members (multi-user account)
                  </label>
                  {pkgForm.team_enabled && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500">Seat limit (blank = unlimited)</label>
                      <input type="number" min="1" className="form-input w-24 py-1" placeholder="∞" value={pkgForm.team_seats} onChange={e => setPkgForm(p => ({ ...p, team_seats: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
              {/* Live price summary */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg bg-white border border-slate-200 px-4 py-3 mb-3 text-sm">
                <span className="font-bold text-slate-800">${Number(pkgForm.price) || 0}<span className="text-xs font-normal text-slate-400">/mo</span></span>
                {oneTime > 0 && <span className="text-slate-600">+ ${oneTime} <span className="text-xs text-slate-400">one-time</span></span>}
                <span className="text-xs text-slate-400">{pkgForm.requests_per_month || 0} requests/mo · {pkgForm.hours_per_month || 0}h/mo</span>
                {pkgForm.team_enabled && <span className="text-xs text-slate-400">· team: {pkgForm.team_seats || '∞'} seats</span>}
              </div>
              <button onClick={createPackage} disabled={pkgSaving || !pkgForm.name || pkgForm.price === ''} className="btn-primary text-xs px-4 py-2">
                {pkgSaving ? 'Creating…' : 'Create Custom Plan'}
              </button>
            </div>
          )}

          {/* Filter */}
          {packages.length > 0 && (
            <div className="flex gap-2 px-5 py-3 border-b border-slate-100">
              {([['all', 'All'], ['monthly', 'Monthly Plans'], ['one-time', 'One-time / Builds']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPkgFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    pkgFilter === key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Existing client plans (assignable via Edit Client) */}
          {!packages.length ? (
            <div className="px-5 py-6 text-center text-sm text-slate-400">
              No client plans yet. Run the latest <code>pending-migrations.sql</code> to seed the standard plans, or create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Plan</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Requests / mo</th>
                  <th className="table-th">Hours / mo</th>
                  <th className="table-th">Response</th>
                  <th className="table-th">Extra rate</th>
                  <th className="table-th">Team</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {packages
                  .filter(p => {
                    const isMonthly = p.hours_per_month > 0 || p.requests_per_month > 0
                    return pkgFilter === 'all' || (pkgFilter === 'monthly' ? isMonthly : !isMonthly)
                  })
                  .map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="table-td font-semibold text-slate-800">{p.name}</td>
                    <td className="table-td">
                      ${p.price}{(p.hours_per_month > 0 || p.requests_per_month > 0) ? '/mo' : ' one-time'}
                    </td>
                    <td className="table-td text-slate-500">{p.requests_per_month}</td>
                    <td className="table-td text-slate-500">{p.hours_per_month}h</td>
                    <td className="table-td text-slate-500 text-xs">{p.response_time}</td>
                    <td className="table-td text-slate-500">${p.extra_hourly_rate}/hr</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(p as any).team_enabled}
                            onChange={e => updateTeam(p, { team_enabled: e.target.checked })}
                          />
                          {(p as any).team_enabled ? 'On' : 'Off'}
                        </label>
                        {(p as any).team_enabled && (
                          <input
                            type="number"
                            min="1"
                            placeholder="∞"
                            defaultValue={(p as any).team_seats ?? ''}
                            onBlur={e => updateTeam(p, { team_seats: e.target.value === '' ? null : Number(e.target.value) })}
                            className="form-input w-16 py-0.5 text-xs"
                            title="Seat limit (blank = unlimited)"
                          />
                        )}
                      </div>
                    </td>
                    <td className="table-td text-right whitespace-nowrap">
                      <button onClick={() => setEditPkg({ ...p })} className="text-xs text-blue-600 hover:underline font-medium">
                        Edit
                      </button>
                      <button onClick={() => deletePackage(p)} className="ml-3 text-xs text-red-500 hover:text-red-600 hover:underline font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* ── Plan edit modal ── */}
        {editPlan && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEditPlan(null)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">Edit Plan</h2>
                <button onClick={() => setEditPlan(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editPlan.name} onChange={e => setEditPlan(p => p && ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input min-h-20 resize-none" value={editPlan.description} onChange={e => setEditPlan(p => p && ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Badge (e.g. &quot;Most Popular&quot;)</label>
                    <input className="form-input" value={editPlan.badge || ''} placeholder="Keep site default" onChange={e => setEditPlan(p => p && ({ ...p, badge: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Delivery time</label>
                    <input className="form-input" value={editPlan.delivery || ''} placeholder="e.g. 7–10 business days" onChange={e => setEditPlan(p => p && ({ ...p, delivery: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Features — one per line (&quot;What&apos;s included&quot;)</label>
                  <textarea
                    className="form-input min-h-32 resize-y font-mono text-xs"
                    value={featuresText}
                    placeholder={'Up to 5 pages\nMobile responsive design\nContact form + Google Maps'}
                    onChange={e => setFeaturesText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Detail rows — &quot;Label | Value&quot; per line</label>
                  <textarea
                    className="form-input min-h-24 resize-y font-mono text-xs"
                    value={detailsText}
                    placeholder={'Number of pages | Up to 5 pages\nRevision rounds | 2 rounds\nDelivery time | 7–10 business days'}
                    onChange={e => setDetailsText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">&quot;Best for&quot; text</label>
                  <textarea
                    className="form-input min-h-16 resize-none"
                    value={editPlan.good_for || ''}
                    placeholder="Keep site default"
                    onChange={e => setEditPlan(p => p && ({ ...p, good_for: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Regular price ({planRegion === 'mk' ? 'MKD/ден' : 'USD'})</label>
                    <input type="number" min="0" className="form-input" value={editPlan.price} onChange={e => setEditPlan(p => p && ({ ...p, price: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="form-label">Billing</label>
                    <input className="form-input bg-slate-50" value={editPlan.billing_interval ? 'Monthly subscription' : 'One-time'} readOnly />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={editPlan.sale_active}
                      onChange={e => setEditPlan(p => p && ({ ...p, sale_active: e.target.checked }))}
                    />
                    <span className="text-sm font-semibold text-slate-700">🏷️ On sale / promotion</span>
                  </label>
                  {editPlan.sale_active && (
                    <div>
                      <label className="form-label">Sale price ({planRegion === 'mk' ? 'MKD/ден' : 'USD'}){editPlan.billing_interval ? ' per month' : ''}</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editPlan.sale_price ?? ''}
                        placeholder={`Less than ${editPlan.price}`}
                        onChange={e => setEditPlan(p => p && ({ ...p, sale_price: e.target.value === '' ? null : Number(e.target.value) }))}
                      />
                      <p className="text-xs text-slate-400 mt-1">Customers are charged this price; the regular price shows crossed out on the site.</p>
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={editPlan.is_active}
                    onChange={e => setEditPlan(p => p && ({ ...p, is_active: e.target.checked }))}
                  />
                  <span className="text-sm font-semibold text-slate-700">Visible / purchasable on the website</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn-ghost" onClick={() => setEditPlan(null)}>Cancel</button>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
                  onClick={savePlan}
                  disabled={planSaving}
                >
                  {planSaving ? <><Spinner size="sm" /> Saving…</> : 'Save Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Custom Plan (support package) ── */}
        {editPkg && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEditPkg(null)}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-slate-800">Edit Custom Plan</h2>
                <button onClick={() => setEditPkg(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="form-label">Plan name</label>
                  <input className="form-input" value={editPkg.name || ''} onChange={e => setEditPkg((p: any) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Price ($/month)</label>
                  <input type="number" min="0" className="form-input" value={editPkg.price ?? ''} onChange={e => setEditPkg((p: any) => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">One-time setup ($)</label>
                  <input type="number" min="0" className="form-input" value={editPkg.setup_fee ?? ''} onChange={e => setEditPkg((p: any) => ({ ...p, setup_fee: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Extra rate ($/hr)</label>
                  <input type="number" min="0" className="form-input" value={editPkg.extra_hourly_rate ?? ''} onChange={e => setEditPkg((p: any) => ({ ...p, extra_hourly_rate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Hours / month</label>
                  <input type="number" min="0" step="0.5" className="form-input" value={editPkg.hours_per_month ?? ''} onChange={e => setEditPkg((p: any) => ({ ...p, hours_per_month: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Requests / month</label>
                  <input type="number" min="0" className="form-input" value={editPkg.requests_per_month ?? ''} onChange={e => setEditPkg((p: any) => ({ ...p, requests_per_month: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Response time</label>
                  <input className="form-input" value={editPkg.response_time || ''} onChange={e => setEditPkg((p: any) => ({ ...p, response_time: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">What&apos;s included (description)</label>
                  <textarea className="form-input min-h-20 resize-y text-xs" value={editPkg.description || ''} onChange={e => setEditPkg((p: any) => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setEditPkg(null)}>Cancel</button>
                <button className="btn-secondary flex items-center gap-2" onClick={savePkg} disabled={pkgEditSaving || !editPkg.name}>
                  {pkgEditSaving ? <><Spinner size="sm" /> Saving…</> : 'Save Plan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
