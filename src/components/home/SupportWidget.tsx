'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Headphones, X, Send, Smile } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import EmojiPicker from '@/components/common/EmojiPicker'

const IS_MOCK = process.env.NEXT_PUBLIC_SUPABASE_MOCK === 'true'
const MSGS_KEY = 'support_messages'
const SESSION_KEY = 'support_session'

export interface SupportMsg {
  id: string
  session_id: string
  user_name: string
  user_email: string
  message: string
  is_admin: boolean
  created_at: string
}

interface Session {
  id: string
  name: string
  email: string
}

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export function loadAllMsgs(): SupportMsg[] {
  try { return JSON.parse(localStorage.getItem(MSGS_KEY) ?? '[]') } catch { return [] }
}
export function saveAllMsgs(msgs: SupportMsg[]) {
  localStorage.setItem(MSGS_KEY, JSON.stringify(msgs))
  window.dispatchEvent(new StorageEvent('storage', { key: MSGS_KEY, newValue: JSON.stringify(msgs) }))
}

function loadSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
}
function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export default function SupportWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [messages, setMessages] = useState<SupportMsg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [unread, setUnread] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const openRef = useRef(false)

  useEffect(() => { openRef.current = open }, [open])
  useEffect(() => { if (open) setUnread(0) }, [open])

  useEffect(() => {
    if (user) {
      const s: Session = { id: user.email, name: user.name, email: user.email }
      setSession(s)
      if (IS_MOCK) saveSession(s)
    } else {
      const stored = loadSession()
      if (stored) setSession(stored)
    }
  }, [user])

  useEffect(() => {
    if (!session) return
    if (IS_MOCK) {
      setMessages(loadAllMsgs().filter(m => m.session_id === session.id))
      try {
        const sts = JSON.parse(localStorage.getItem('support_statuses') ?? '{}')
        setIsClosed(sts[session.id] === 'closed')
      } catch {}
      return
    }
    supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as SupportMsg[]) })
  }, [session])

  useEffect(() => {
    if (!session) return
    if (IS_MOCK) {
      const handler = (e: StorageEvent) => {
        if (e.key === MSGS_KEY && e.newValue) {
          try {
            const all = JSON.parse(e.newValue) as SupportMsg[]
            const mine = all.filter(m => m.session_id === session.id)
            setMessages(mine)
            const last = mine[mine.length - 1]
            if (last?.is_admin && !openRef.current) setUnread(n => n + 1)
          } catch {}
        }
        if (e.key === 'support_statuses' && e.newValue) {
          try {
            const sts = JSON.parse(e.newValue)
            const closed = sts[session.id] === 'closed'
            setIsClosed(closed)
            if (closed && !openRef.current) setUnread(n => n + 1)
          } catch {}
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
    // também carrega status inicial
    supabase
      .from('support_statuses')
      .select('status')
      .eq('session_id', session.id)
      .single()
      .then(({ data }) => { if (data?.status === 'closed') setIsClosed(true) })

    const channel = supabase
      .channel(`support:${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `session_id=eq.${session.id}` }, payload => {
        const msg = payload.new as SupportMsg
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        if (msg.is_admin && !openRef.current) setUnread(n => n + 1)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_statuses', filter: `session_id=eq.${session.id}` }, payload => {
        const row = payload.new as { status: string }
        if (row?.status === 'closed') {
          setIsClosed(true)
          if (!openRef.current) setUnread(n => n + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  function startSession() {
    if (!nameInput.trim()) return
    const s: Session = { id: genId(), name: nameInput.trim(), email: emailInput.trim() }
    saveSession(s)
    setSession(s)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !text.trim() || sending) return
    setSending(true)
    const msg: SupportMsg = {
      id: genId(),
      session_id: session.id,
      user_name: session.name,
      user_email: session.email,
      message: text.trim(),
      is_admin: false,
      created_at: new Date().toISOString(),
    }
    setText('')
    if (IS_MOCK) {
      const all = loadAllMsgs()
      saveAllMsgs([...all, msg])
    } else {
      setMessages(prev => [...prev, msg])
      await supabase.from('support_messages').insert(msg)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="support-panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 320, height: 460, background: '#0E0E16', border: '1px solid rgba(255,106,0,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)' }}>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-white" />
                <span className="text-white font-black text-sm">Suporte</span>
                <span className="text-white/70 text-[10px]">· Nossa equipe responde em breve</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!session ? (
              <div className="flex-1 flex flex-col px-4 py-4 gap-4 overflow-y-auto">
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,106,0,0.2)', border: '1px solid rgba(255,106,0,0.3)' }}>
                    <Headphones className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-orange-400 text-[10px] font-black">Suporte FutZone</p>
                    <div className="rounded-2xl rounded-bl-sm px-3 py-2.5 text-xs leading-relaxed text-gray-200"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>
                      👋 Olá! Seja bem-vindo ao suporte da <span className="text-orange-400 font-bold">FutZone</span>.<br /><br />
                      Para iniciarmos o atendimento, por favor nos informe <strong className="text-white">seu nome</strong> e <strong className="text-white">sua dúvida</strong> que nossa equipe responde em breve! 😊
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startSession()}
                    placeholder="Seu nome *"
                    className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startSession()}
                    placeholder="Email (opcional)"
                    className="w-full bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={startSession}
                    disabled={!nameInput.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}
                  >
                    Iniciar conversa
                  </button>
                </div>
              </div>
            ) : isClosed ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-3xl">✅</p>
                  <p className="text-white font-bold text-sm">Atendimento encerrado</p>
                  <p className="text-gray-500 text-xs">Seu ticket foi resolvido pela nossa equipe.</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('support_session')
                    localStorage.removeItem('support_statuses')
                    setSession(null)
                    setMessages([])
                    setIsClosed(false)
                    setNameInput('')
                    setEmailInput('')
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}
                >
                  Abrir novo atendimento
                </button>
              </div>
            ) : (
              <>
                <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                  {messages.length === 0 && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,106,0,0.2)', border: '1px solid rgba(255,106,0,0.3)' }}>
                        <Headphones className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-orange-400 text-[10px] font-black">Suporte FutZone</p>
                        <div className="rounded-2xl rounded-bl-sm px-3 py-2.5 text-xs leading-relaxed text-gray-200"
                          style={{ background: 'rgba(255,255,255,0.07)' }}>
                          👋 Olá, <span className="text-white font-bold">{session.name}</span>! Deixe aqui sua dúvida ou problema e nossa equipe te responde em breve 😊
                        </div>
                      </div>
                    </div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className="max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                        style={m.is_admin ? {
                          background: 'rgba(255,255,255,0.07)',
                          color: '#e5e7eb',
                          borderBottomLeftRadius: 4,
                        } : {
                          background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                          color: '#fff',
                          borderBottomRightRadius: 4,
                        }}
                      >
                        {m.is_admin && <p className="text-orange-400 text-[10px] font-black mb-0.5">Suporte FutZone</p>}
                        {m.message}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2.5 shrink-0 border-t border-white/5">
                  <form onSubmit={send} className="flex items-center gap-2 relative">
                    {showEmoji && (
                      <EmojiPicker
                        onSelect={emoji => { setText(t => t + emoji); setShowEmoji(false); inputRef.current?.focus() }}
                        onClose={() => setShowEmoji(false)}
                      />
                    )}
                    <button type="button" onClick={() => setShowEmoji(v => !v)}
                      className="shrink-0 text-gray-500 hover:text-orange-400 transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      maxLength={500}
                      placeholder="Escreva sua mensagem..."
                      className="flex-1 min-w-0 text-sm text-white placeholder-gray-600 bg-transparent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !text.trim()}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={{ background: sending || !text.trim() ? 'rgba(255,106,0,0.2)' : 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)' }}
                    >
                      <Send className="w-3.5 h-3.5" style={{ color: sending || !text.trim() ? 'rgba(255,106,0,0.35)' : '#fff' }} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ width: hovered ? 'auto' : 52 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileTap={{ scale: 0.93 }}
        className="animate-orange-pulse fixed bottom-6 right-4 sm:right-6 z-50 flex items-center justify-center overflow-hidden rounded-full font-black text-sm text-white"
        style={{
          height: 52,
          minWidth: 52,
          background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
          boxShadow: '0 0 28px rgba(255,106,0,0.55)',
          paddingLeft: hovered ? 20 : 0,
          paddingRight: hovered ? 20 : 0,
          transition: 'padding 0.3s ease',
        }}
      >
        <Headphones className="w-5 h-5 shrink-0" />
        <AnimatePresence>
          {hovered && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: 0.22 }}
              className="whitespace-nowrap overflow-hidden"
            >
              Suporte
            </motion.span>
          )}
        </AnimatePresence>
        {unread > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full text-[11px] font-black flex items-center justify-center px-1"
            style={{ background: '#fff', color: '#FF6A00', boxShadow: '0 0 0 2px #FF6A00' }}
          >
            {unread}
          </span>
        )}
      </motion.button>
    </>
  )
}
