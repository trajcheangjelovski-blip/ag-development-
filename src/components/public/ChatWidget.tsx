'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'

type Msg = { role: 'user' | 'assistant'; content: string }

// Renders /paths and full URLs as links
function ChatText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+|(?<![\w/])\/[a-z][a-z0-9\-/?=&#]*)/g)
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return <a key={i} href={part} target="_blank" rel="noreferrer" className="underline font-semibold">{part}</a>
        }
        if (/^\/[a-z]/.test(part)) {
          return <a key={i} href={part} className="underline font-semibold">{part}</a>
        }
        return part
      })}
    </span>
  )
}

export function ChatWidget() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('chat')
  const greeting: Msg = { role: 'assistant', content: t('greeting') }
  const quickQuestions = t.raw('quickQuestions') as string[]
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([greeting])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  // "Leave a message" form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [formBusy, setFormBusy] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [formError, setFormError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  // Restore conversation for the session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ag-chat')
      if (saved) setMessages(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem('ag-chat', JSON.stringify(messages.slice(-30))) } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  // Hide on portal/admin/login pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/portal') || pathname === '/login') return null

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || typing) return
    setInput('')
    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setTyping(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-12), locale }),
      })
      const data = await res.json()
      if (res.status === 503 && data?.error === 'not_configured') {
        setUnavailable(true)
        setShowForm(true)
        setMessages(m => [...m, { role: 'assistant', content: t('offlineMessage') }])
        return
      }
      if (!res.ok) throw new Error(data?.error || t('errorGeneric'))
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: e instanceof Error ? e.message : t('errorGeneric'),
      }])
    } finally {
      setTyping(false)
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setFormBusy(true)
    setFormError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service: 'Website chat' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send')
      setFormSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setFormBusy(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: 'min(560px, calc(100vh - 40px))' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0f1f3d, #162b52)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-extrabold text-white text-sm" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              AG
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm">{t('headerTitle')}</div>
              <div className="text-white/50 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {unavailable ? t('statusOffline') : t('statusOnline')}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white p-1 text-lg leading-none" aria-label="Close chat">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                  }`}
                  style={m.role === 'user' ? { background: '#2563eb' } : undefined}
                >
                  <ChatText text={m.content} />
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick questions (start of conversation) */}
            {messages.length <= 1 && !typing && !showForm && (
              <div className="space-y-2 pt-1">
                {quickQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full text-left text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 hover:bg-blue-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Leave a message form */}
            {showForm && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                {formSent ? (
                  <div className="text-center py-3">
                    <div className="text-2xl mb-2">📬</div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{t('sentTitle')}</p>
                    <p className="text-xs text-slate-500">{t('sentBody')}</p>
                  </div>
                ) : (
                  <form onSubmit={submitForm} className="space-y-2.5">
                    <p className="text-xs font-bold text-slate-700">{t('leaveMessageTitle')}</p>
                    {formError && <p className="text-xs text-red-500">{formError}</p>}
                    <input className="form-input text-sm py-2" placeholder={t('formName')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    <input type="email" className="form-input text-sm py-2" placeholder={t('formEmail')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                    <textarea className="form-input text-sm py-2 min-h-16 resize-none" placeholder={t('formMessage')} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
                    <button type="submit" disabled={formBusy} className="w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60" style={{ background: '#2563eb' }}>
                      {formBusy ? t('formSending') : t('formSend')}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex-shrink-0 bg-white">
            <div className="flex gap-2">
              <input
                className="form-input text-sm py-2.5 flex-1"
                placeholder={unavailable ? t('inputPlaceholderOffline') : t('inputPlaceholder')}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={typing || unavailable}
                maxLength={1000}
              />
              <button
                onClick={() => send()}
                disabled={typing || !input.trim() || unavailable}
                className="px-3.5 rounded-lg text-white transition-all disabled:opacity-40 flex-shrink-0"
                style={{ background: '#2563eb' }}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-0.5">
              <button onClick={() => { setShowForm(v => !v); setFormSent(false) }} className="text-[11px] text-slate-400 hover:text-blue-600 font-medium">
                {showForm ? t('hideForm') : t('leaveMessageToggle')}
              </button>
              <span className="text-[10px] text-slate-300">{t('disclaimer')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
