'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Send, Trash2, Ban, Pin, PinOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const HOME_STREAM_ID = 'home'

const COLORS = [
  '#ff6a00', '#00e5ff', '#69ff47', '#ffe900', '#ff4dff',
  '#ff4444', '#4daaff', '#ff9500', '#00ffb3', '#c084fc',
]
function userColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type Msg = {
  id: string
  user_name: string
  message: string
  created_at: string
  is_pinned: boolean
  is_admin?: boolean
}

const IS_MOCK = process.env.NEXT_PUBLIC_SUPABASE_MOCK === 'true'
const MOCK_MSGS_KEY  = 'chat_home_messages'
const MOCK_BLOCK_KEY = 'chat_home_blocked'

function getGuestName(): string {
  const key = 'chat_guest_name'
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const name = 'Visitante' + Math.floor(1000 + Math.random() * 9000)
  localStorage.setItem(key, name)
  return name
}

function mockLoadMsgs(): Msg[] {
  try { return JSON.parse(localStorage.getItem(MOCK_MSGS_KEY) ?? '[]') } catch { return [] }
}
function mockSaveMsgs(msgs: Msg[]) {
  localStorage.setItem(MOCK_MSGS_KEY, JSON.stringify(msgs))
  window.dispatchEvent(new StorageEvent('storage', { key: MOCK_MSGS_KEY, newValue: JSON.stringify(msgs) }))
}
function mockLoadBlocked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(MOCK_BLOCK_KEY) ?? '[]')) } catch { return new Set() }
}
function mockSaveBlocked(set: Set<string>) {
  const arr = [...set]
  localStorage.setItem(MOCK_BLOCK_KEY, JSON.stringify(arr))
  window.dispatchEvent(new StorageEvent('storage', { key: MOCK_BLOCK_KEY, newValue: JSON.stringify(arr) }))
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function HomeChatWidget() {
  const { user } = useAuth()
  const [open, setOpen]               = useState(false)
  const [messages, setMessages]       = useState<Msg[]>([])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [isBlocked, setIsBlocked]     = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const [unread, setUnread]           = useState(0)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const openRef      = useRef(false)
  const selfSending  = useRef(false)

  useEffect(() => { openRef.current = open }, [open])

  const pinnedMessage   = messages.find(m => m.is_pinned) ?? null
  const regularMessages = messages.filter(m => !m.is_pinned)

  /* Admin check */
  useEffect(() => {
    if (!user?.email) { setIsAdmin(false); return }
    const moderators = (process.env.NEXT_PUBLIC_CHAT_MODERATORS ?? '').split(',').map(e => e.trim())
    if (moderators.includes(user.email)) { setIsAdmin(true); return }
    supabase
      .from('registrations')
      .select('is_admin')
      .eq('email', user.email)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
  }, [user?.email])

  /* Block check + blocked list */
  useEffect(() => {
    if (IS_MOCK) {
      const blocked = mockLoadBlocked()
      const userName = user?.name ?? getGuestName()
      setIsBlocked(blocked.has(userName))
      if (isAdmin) setBlockedUsers(blocked)
      const handler = (e: StorageEvent) => {
        if (e.key !== MOCK_BLOCK_KEY) return
        const updated = mockLoadBlocked()
        setIsBlocked(updated.has(userName))
        if (isAdmin) setBlockedUsers(updated)
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }

    if (!user) { setIsBlocked(false); return }
    supabase
      .from('chat_blocked_users')
      .select('id')
      .eq('stream_id', HOME_STREAM_ID)
      .eq('user_name', user.name)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(!!data))

    const ch = supabase
      .channel(`blocked:${HOME_STREAM_ID}:${user.name}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_blocked_users',
        filter: `stream_id=eq.${HOME_STREAM_ID}`,
      }, payload => {
        if ((payload.new as { user_name: string }).user_name === user.name) setIsBlocked(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.name, isAdmin])

  /* Load blocked users list (for admin icons) */
  useEffect(() => {
    if (IS_MOCK || !isAdmin) return
    supabase
      .from('chat_blocked_users')
      .select('user_name')
      .eq('stream_id', HOME_STREAM_ID)
      .then(({ data }) => setBlockedUsers(new Set((data ?? []).map((b: { user_name: string }) => b.user_name))))
  }, [isAdmin])

  /* Carrega mensagens + realtime */
  useEffect(() => {
    if (IS_MOCK) {
      setMessages(mockLoadMsgs())
      const handler = (e: StorageEvent) => {
        if (e.key === MOCK_MSGS_KEY) {
          const updated = mockLoadMsgs()
          setMessages(updated)
          if (!openRef.current && !selfSending.current) setUnread(n => n + 1)
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }

    supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', HOME_STREAM_ID)
      .order('created_at', { ascending: true })
      .limit(120)
      .then(({ data }) => setMessages((data ?? []) as Msg[]))

    const ch = supabase
      .channel(`chat:${HOME_STREAM_ID}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `stream_id=eq.${HOME_STREAM_ID}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Msg])
        if (!openRef.current) setUnread(n => n + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `stream_id=eq.${HOME_STREAM_ID}`,
      }, payload => {
        setMessages(prev => prev.map(m => m.id === (payload.new as Msg).id ? payload.new as Msg : m))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'chat_messages',
      }, payload => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  /* Scroll para o fim + zera contador ao abrir */
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 120)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [regularMessages.length, open])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || isBlocked) return
    setSending(true)
    const userName = user ? user.name : getGuestName()
    const msgText = text.trim()
    setText('')

    if (IS_MOCK) {
      const msg: Msg = {
        id: genId(),
        user_name: userName,
        message: msgText,
        created_at: new Date().toISOString(),
        is_pinned: false,
        is_admin: isAdmin,
      }
      const updated = [...mockLoadMsgs(), msg]
      selfSending.current = true
      mockSaveMsgs(updated)
      selfSending.current = false
      setMessages(updated)
    } else {
      const optimisticId = 'opt-' + genId()
      const optimistic: Msg = {
        id: optimisticId,
        user_name: userName,
        message: msgText,
        created_at: new Date().toISOString(),
        is_pinned: false,
        is_admin: isAdmin,
      }
      setMessages(prev => [...prev, optimistic])

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ stream_id: HOME_STREAM_ID, user_name: userName, message: msgText, is_admin: isAdmin })
        .select()
        .single()

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setText(msgText)
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optimisticId ? (data as Msg) : m))
      }
    }
    setSending(false)
  }

  function deleteMessage(id: string) {
    if (IS_MOCK) {
      const updated = mockLoadMsgs().filter(m => m.id !== id)
      mockSaveMsgs(updated)
      setMessages(updated)
      return
    }
    supabase.from('chat_messages').delete().eq('id', id)
  }

  function blockUser(userName: string) {
    if (IS_MOCK) {
      const blocked = mockLoadBlocked()
      blocked.add(userName)
      mockSaveBlocked(blocked)
      setBlockedUsers(new Set(blocked))
      return
    }
    supabase.from('chat_blocked_users').upsert(
      { stream_id: HOME_STREAM_ID, user_name: userName },
      { onConflict: 'stream_id,user_name' }
    )
    setBlockedUsers(prev => new Set([...prev, userName]))
  }

  function pinMessage(msg: Msg) {
    if (IS_MOCK) {
      const updated = mockLoadMsgs().map(m => ({ ...m, is_pinned: m.id === msg.id }))
      mockSaveMsgs(updated)
      setMessages(updated)
      return
    }
    const current = messages.find(m => m.is_pinned)
    if (current) supabase.from('chat_messages').update({ is_pinned: false }).eq('id', current.id)
    supabase.from('chat_messages').update({ is_pinned: true }).eq('id', msg.id)
  }

  function unpinMessage() {
    if (!pinnedMessage) return
    if (IS_MOCK) {
      const updated = mockLoadMsgs().map(m => ({ ...m, is_pinned: false }))
      mockSaveMsgs(updated)
      setMessages(updated)
      return
    }
    supabase.from('chat_messages').update({ is_pinned: false }).eq('id', pinnedMessage.id)
  }

  function clearAllMessages() {
    if (!confirm('Limpar todas as mensagens do chat?')) return
    if (IS_MOCK) {
      mockSaveMsgs([])
      setMessages([])
      return
    }
    supabase.from('chat_messages').delete().eq('stream_id', HOME_STREAM_ID)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="home-chat"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 24, scale: 0.96  }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 flex flex-col"
            style={{
              width: 'min(360px, calc(100vw - 32px))',
              height: 'min(560px, calc(100vh - 140px))',
              borderRadius: 20,
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0 relative"
              style={{ background: '#18181f', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,106,0,0.15)' }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: '#FF6A00' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Chat da Torcida</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#FF6A00' }} />
                  <span className="text-xs font-semibold" style={{ color: '#FF6A00' }}>Online</span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={clearAllMessages}
                  className="text-gray-600 hover:text-red-500 transition-colors text-base"
                  title="Limpar todas as mensagens"
                >
                  🧹
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensagem fixada */}
            {pinnedMessage && (
              <div
                className="flex items-start gap-2 px-3 py-2 shrink-0"
                style={{ background: 'rgba(255,106,0,0.08)', borderBottom: '1px solid rgba(255,106,0,0.2)' }}
              >
                <Pin className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs flex-1 min-w-0 break-words">
                  <span className="font-bold mr-0.5" style={{ color: userColor(pinnedMessage.user_name) }}>
                    {pinnedMessage.user_name}
                  </span>
                  <span className="text-gray-300">: {pinnedMessage.message}</span>
                </p>
                {isAdmin && (
                  <button onClick={unpinMessage} className="shrink-0 text-gray-500 hover:text-orange-400 transition-colors" title="Desafixar">
                    <PinOff className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {regularMessages.length === 0 && (
                <p className="text-center text-gray-600 text-xs mt-6">
                  Nenhuma mensagem ainda. Seja o primeiro! 👋
                </p>
              )}
              {regularMessages.map(m => (
                m.is_admin ? (
                  <div
                    key={m.id}
                    className="group rounded-2xl px-4 py-3 relative"
                    style={{
                      background: 'rgba(161,124,0,0.15)',
                      border: '1.5px solid rgba(234,179,8,0.35)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">🔊</span>
                      <span className="text-yellow-400 text-sm font-bold">{m.user_name}</span>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-md tracking-wide"
                        style={{ background: 'rgba(234,179,8,0.2)', color: '#facc15', border: '1px solid rgba(234,179,8,0.35)' }}
                      >
                        ADMIN
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    <p className="text-right text-yellow-600/60 text-[10px] mt-1.5">{fmtTime(m.created_at)}</p>
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => deleteMessage(m.id)} className="text-gray-600 hover:text-red-500 transition-colors" title="Excluir">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={m.id} className="group flex gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black mt-0.5"
                      style={{ background: userColor(m.user_name) + '22', color: userColor(m.user_name) }}
                    >
                      {m.user_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold" style={{ color: userColor(m.user_name) }}>{m.user_name}</span>
                        <span className="text-gray-700 text-[10px]">{fmtTime(m.created_at)}</span>
                      </div>
                      <p className="text-gray-200 text-sm leading-snug break-words mt-0.5">{m.message}</p>
                    </div>
                    {isAdmin && (
                      <div className="shrink-0 flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => pinMessage(m)} className="text-gray-700 hover:text-orange-400 transition-colors" title="Fixar">
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => blockUser(m.user_name)}
                          disabled={blockedUsers.has(m.user_name)}
                          className={`transition-colors ${blockedUsers.has(m.user_name) ? 'text-yellow-600 cursor-not-allowed' : 'text-gray-700 hover:text-yellow-500'}`}
                          title={blockedUsers.has(m.user_name) ? 'Já bloqueado' : 'Bloquear usuário'}
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteMessage(m.id)} className="text-gray-700 hover:text-red-500 transition-colors" title="Excluir">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="shrink-0 px-3 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              {isBlocked ? (
                <p className="text-center text-red-400 text-xs py-2 px-1">
                  Você foi bloqueado de comentar neste chat.
                </p>
              ) : (
                <form onSubmit={send} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={200}
                    placeholder="Manda um salve pra galera..."
                    className="flex-1 min-w-0 text-sm text-white placeholder-gray-600 bg-transparent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{ background: sending || !text.trim() ? 'rgba(255,106,0,0.25)' : 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)' }}
                  >
                    <Send className="w-4 h-4" style={{ color: sending || !text.trim() ? 'rgba(255,106,0,0.4)' : '#fff' }} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        initial={false}
        animate={open ? 'expanded' : 'collapsed'}
        whileHover="expanded"
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 z-50 flex items-center overflow-hidden font-bold text-sm shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
          color: '#fff',
          borderRadius: 999,
          height: 48,
          boxShadow: '0 0 18px rgba(255,106,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        }}
        aria-label="Abrir chat da torcida"
      >
        <span className="flex items-center justify-center w-12 h-12 shrink-0">
          <MessageSquare className="w-5 h-5 shrink-0" />
        </span>
        <motion.span
          className="whitespace-nowrap text-sm font-bold"
          variants={{
            collapsed: { width: 0, opacity: 0, paddingRight: 0 },
            expanded:  { width: 'auto', opacity: 1, paddingRight: 20 },
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          Chat da Torcida
        </motion.span>
        {!open && unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center"
            style={{ boxShadow: '0 0 0 2px #FF6A00, 0 2px 6px rgba(0,0,0,0.4)', lineHeight: 1 }}
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </motion.button>
    </>
  )
}
