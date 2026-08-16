'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PublicHeader } from '@/components/public/Header'
import { PublicFooter } from '@/components/public/Footer'
import { Spinner } from '@/components/ui'
import { fbTrack } from '@/lib/fbpixel'

export default function ContactPage() {
  const t = useTranslations('contact')
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
        throw new Error(data?.error || t('errorGeneric'))
      }
      setSent(true)
      fbTrack('Lead', { content_name: 'Contact Form' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const info = [
    { icon: '📧', label: t('emailLabel'), val: 'support@ag-development.dev', href: 'mailto:support@ag-development.dev' },
    { icon: '💬', label: t('responseLabel'), val: t('responseValue') },
    { icon: '🕘', label: t('hoursLabel'), val: t('hoursValue') },
    { icon: '🌐', label: t('supportLabel'), val: t('supportValue') },
  ]

  return (
    <>
      <PublicHeader />
      <section className="text-white py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)' }}>
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-extrabold text-white mb-4">{t('title')}</h1>
          <p className="text-white/75 text-lg mb-3">{t('subtitle')}</p>
          <p className="text-white font-semibold">{t('subtitle2')}</p>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-800 mb-4">{t('talkTitle')}</h2>
            <p className="text-slate-500 leading-relaxed mb-3">{t('talkP1')}</p>
            <p className="text-slate-500 leading-relaxed mb-8">{t('talkP2')}</p>
            <div className="space-y-5">
              {info.map(({ icon, label, val, href }) => (
                <div key={label} className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{label}</div>
                    {href
                      ? <a href={href} className="text-sm text-blue-600 hover:underline">{val}</a>
                      : <div className="text-sm text-slate-500">{val}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-semibold text-sm text-slate-800 mb-1">{t('notSureTitle')}</div>
              <p className="text-sm text-slate-500 leading-relaxed">{t('notSureText')}</p>
            </div>
          </div>

          <div className="card p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📬</div>
                <h3 className="font-display text-xl font-extrabold text-slate-800 mb-2">{t('sentTitle')}</h3>
                <p className="text-slate-500 text-sm">{t('sentText')}</p>
              </div>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-5">{t('formTitle')}</h3>
                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><label className="form-label">{t('nameLabel')}</label><input className="form-input" placeholder={t('namePlaceholder')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div><label className="form-label">{t('emailLabel')}</label><input type="email" className="form-input" placeholder={t('emailPlaceholder')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
                  <div><label className="form-label">{t('messageLabel')}</label><textarea className="form-input min-h-28 resize-none" placeholder={t('messagePlaceholder')} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required /></div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-70"
                    style={{ background: '#0f1f3d' }}>
                    {loading ? <><Spinner size="sm" /> {t('sending')}</> : t('submit')}
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
