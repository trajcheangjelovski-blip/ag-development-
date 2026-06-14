'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { APP_TIME_ZONE } from '@/lib/utils'
import type { Profile } from '@/types'

const EMOJIS = ['😀','😅','😂','🙂','😉','😍','😊','👍','🙏','🎉','🔥','✅','❌','⚠️','💡','📎','😎','😢','😡','❤️','👏','🚀','💯','🙌']

function chatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: APP_TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

const isImageUrl = (u: string) => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(u)

// Renders message text with clickable links + inline image previews for attachments
function ChatBody({ text, mine }: { text: string; mine: boolean }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (!/^https?:\/\//.test(p)) return <span key={i}>{p}</span>
        if (isImageUrl(p)) {
          return (
            <a key={i} href={p} target="_blank" rel="noreferrer" className="block mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="attachment" className="max-h-44 rounded-lg border border-black/10" />
            </a>
          )
        }
        return <a key={i} href={p} target="_blank" rel="noreferrer" className={`underline ${mine ? 'text-blue-100' : 'text-blue-600'}`}>{p.length > 40 ? `${p.slice(0, 37)}…` : p}</a>
      })}
    </>
  )
}

// Messenger-style popup chat between a client and AG, inside the portal.
// One continuous conversation per client. Polls while open.
export function PortalChat({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin'
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'chat'>(isAdmin ? 'list' : 'chat')
  const [activeClient, setActiveClient] = useState<{ id: string; name: string } | null>(
    isAdmin ? null : (profile.client_id ? { id: profile.client_id, name: 'AG Development' } : null)
  )
  const [messages, setMessages] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [othersTyping, setOthersTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastTypingPing = useRef(0)

  function pingTyping() {
    const now = Date.now()
    if (!activeClient || now - lastTypingPing.current < 2000) return
    lastTypingPing.current = now
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: isAdmin ? activeClient.id : undefined }),
    }).catch(() => {})
  }

  async function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !activeClient) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', f)
    if (isAdmin) fd.append('client_id', activeClient.id)
    const up = await fetch('/api/chat/upload', { method: 'POST', body: fd })
    if (up.ok) {
      const data = await up.json()
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `📎 ${data.name}: ${data.url}`, client_id: isAdmin ? activeClient.id : undefined }),
      })
      await loadMessages(activeClient.id)
    }
    setUploading(false)
  }

  const loadUnread = useCallback(async () => {
    const r = await fetch('/api/chat/unread')
    if (r.ok) setUnread((await r.json()).unread || 0)
  }, [])
  const loadConversations = useCallback(async () => {
    const r = await fetch('/api/chat/conversations')
    if (r.ok) setConversations((await r.json()).conversations || [])
  }, [])
  const loadMessages = useCallback(async (clientId: string) => {
    const r = await fetch(`/api/chat/messages?client_id=${clientId}`)
    if (r.ok) { const d = await r.json(); setMessages(d.messages || []); setOthersTyping(!!d.othersTyping) }
  }, [])

  // Unread badge polling (always)
  useEffect(() => {
    loadUnread()
    const t = setInterval(loadUnread, 15000)
    return () => clearInterval(t)
  }, [loadUnread])

  // Poll the active view while the panel is open
  useEffect(() => {
    if (!open) return
    let t: ReturnType<typeof setInterval> | undefined
    if (isAdmin && view === 'list') {
      loadConversations()
      t = setInterval(loadConversations, 6000)
    } else if (activeClient) {
      loadMessages(activeClient.id)
      loadUnread()
      t = setInterval(() => { loadMessages(activeClient.id); loadUnread() }, 4000)
    }
    return () => { if (t) clearInterval(t) }
  }, [open, view, activeClient, isAdmin, loadConversations, loadMessages, loadUnread])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || !activeClient) return
    setSending(true)
    const r = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, client_id: isAdmin ? activeClient.id : undefined }),
    })
    if (r.ok) { setInput(''); await loadMessages(activeClient.id) }
    setSending(false)
  }

  // Clients without an account can't chat
  if (!isAdmin && !profile.client_id) return null

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-80 h-[70vh] max-h-[28rem] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 text-white" style={{ background: '#0f1f3d' }}>
            {isAdmin && view === 'chat' && (
              <button onClick={() => { setView('list'); setActiveClient(null) }} className="text-white/80 hover:text-white">←</button>
            )}
            <span className="font-semibold text-sm flex-1 truncate">
              {isAdmin ? (view === 'list' ? 'Messages' : activeClient?.name) : 'Chat with AG Development'}
            </span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </div>

          {isAdmin && view === 'list' ? (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No conversations yet.</p>
              ) : conversations.map(c => (
                <button
                  key={c.client_id}
                  onClick={() => { setActiveClient({ id: c.client_id, name: c.name }); setView('chat') }}
                  className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{c.name}</div>
                    <div className="text-xs text-slate-400 truncate">{c.last_body}</div>
                  </div>
                  {c.unread > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">{c.unread}</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No messages yet. Say hi 👋</p>
                ) : messages.map(m => {
                  const mine = (m.sender_role === 'admin') === isAdmin
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                        <ChatBody text={m.body} mine={mine} />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 px-1">{chatTime(m.created_at)}</span>
                    </div>
                  )
                })}
                {othersTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-400 text-sm px-3 py-2 rounded-2xl italic">typing…</div>
                  </div>
                )}
              </div>
              {showEmoji && (
                <div className="grid grid-cols-8 gap-1 px-2 pt-2 border-t border-slate-100">
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setInput(i => i + em)} className="text-lg rounded hover:bg-slate-100">{em}</button>
                  ))}
                </div>
              )}
              <div className="p-2 border-t border-slate-100 flex items-center gap-1.5">
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0 disabled:opacity-50" title="Attach a file">
                  {uploading ? '…' : '📎'}
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={onAttach} />
                <button onClick={() => setShowEmoji(v => !v)} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0" title="Emoji">😊</button>
                <input
                  className="form-input text-sm py-2 flex-1"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => { setInput(e.target.value); pingTyping() }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
                <button onClick={send} disabled={sending || !input.trim()} className="btn-primary text-sm px-3 flex-shrink-0">Send</button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center text-2xl relative transition-transform hover:scale-105"
        style={{ background: '#2563eb' }}
        aria-label="Chat"
      >
        {open ? '×' : '💬'}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
