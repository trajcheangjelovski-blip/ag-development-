'use client'
import { useState } from 'react'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Spinner } from '@/components/ui'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">Contact AG Development</h1>
          <p className="text-white/75 text-lg">Have a question or want to learn more about our services? Send us a message.</p>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-4">Let's Talk</h2>
            <p className="text-slate-500 leading-relaxed mb-8">We work with small businesses across the US. Everything is handled remotely — no on-site visits required.</p>
            <div className="space-y-5">
              {[
                ['📧', 'Email', 'support@ag-development.dev'],
                ['💬', 'Response Time', 'Within 1 business day'],
                ['🕘', 'Business Hours', 'Mon–Fri, 9am–6pm Eastern'],
                ['🌎', 'Location', 'US-based, Remote Support'],
              ].map(([icon, label, val]) => (
                <div key={label} className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div><div className="font-semibold text-sm text-slate-800">{label}</div><div className="text-sm text-slate-500">{val}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📬</div>
                <h3 className="font-display text-xl font-extrabold text-slate-800 mb-2">Message Sent!</h3>
                <p className="text-slate-500 text-sm">Thanks for reaching out. We'll get back to you within 1 business day.</p>
              </div>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-5">Send a Message</h3>
                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><label className="form-label">Full Name</label><input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div><label className="form-label">Email</label><input type="email" className="form-input" placeholder="you@business.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
                  <div><label className="form-label">Message</label><textarea className="form-input min-h-28 resize-none" placeholder="What can we help you with?" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required /></div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-70"
                    style={{ background: '#0f1f3d' }}>
                    {loading ? <><Spinner size="sm" /> Sending...</> : 'Send Message →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </>
  )
}
