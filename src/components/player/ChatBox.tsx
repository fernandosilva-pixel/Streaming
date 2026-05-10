'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Send, Trash2, Ban, Pin, PinOff } from 'lucide-react'

type Message = {
  id: string
  user_name: string
  message: string
  created_at: string
  is_pinned: boolean
}

const COLORS = [
  '#ff6a00', '#00e5ff', '#69ff47', '#ffe900', '#ff4dff',
  '#ff4444', '#4daaff', '#ff9500', '#00ffb3', '#c084fc',
]

function getUserColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function ChatBox({ streamId }: { streamId: string }) {
  const { user, showModal } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())
  const messagesRef = useRef<HTMLDivElement>(null)

  const pinnedMessage = messages.find(m => m.is_pinned) ?? null
  const regularMessages = messages.filter(m => !m.is_pinned)

  // Check admin status
  useEffect(() => {
    if (!user?.email) { setIsAdmin(false); return }
    supabase
      .from('registrations')
      .select('is_admin')
      .eq('email', user.email)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
  }, [user?.email])

  // Check if current user is blocked + realtime updates
  useEffect(() => {
    if (!user) { setIsBlocked(false); return }
    supabase
      .from('chat_blocked_users')
      .select('id')
      .eq('stream_id', streamId)
      .eq('user_name', user.name)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(!!data))

    const ch = supabase
      .channel(`blocked:${streamId}:${user.name}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_blocked_users',
        filter: `stream_id=eq.${streamId}`,
      }, payload => {
        if ((payload.new as { user_name: string }).user_name === user.name) setIsBlocked(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user?.name, streamId])

  // Load blocked users list (for admin icons)
  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('chat_blocked_users')
      .select('user_name')
      .eq('stream_id', streamId)
      .then(({ data }) => setBlockedUsers(new Set((data ?? []).map(b => b.user_name))))
  }, [isAdmin, streamId])

  // Load messages + realtime
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data ?? []) as Message[]))

    const channel = supabase
      .channel(`chat:${streamId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${streamId}` },
        payload => setMessages(prev => [...prev, payload.new as Message]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${streamId}` },
        payload => setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        payload => setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id)))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamId])

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [regularMessages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    if (!user) { showModal(); return }
    if (isBlocked) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      stream_id: streamId,
      user_name: user.name,
      message: text.trim(),
    })
    setText('')
    setSending(false)
  }

  async function deleteMessage(id: string) {
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  async function blockUser(userName: string) {
    await supabase.from('chat_blocked_users').upsert(
      { stream_id: streamId, user_name: userName },
      { onConflict: 'stream_id,user_name' }
    )
    setBlockedUsers(prev => new Set([...prev, userName]))
  }

  async function pinMessage(msg: Message) {
    // Desfixa qualquer mensagem anterior
    const current = messages.find(m => m.is_pinned)
    if (current) {
      await supabase.from('chat_messages').update({ is_pinned: false }).eq('id', current.id)
    }
    await supabase.from('chat_messages').update({ is_pinned: true }).eq('id', msg.id)
  }

  async function unpinMessage() {
    if (!pinnedMessage) return
    await supabase.from('chat_messages').update({ is_pinned: false }).eq('id', pinnedMessage.id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#0f0f13] px-4 py-3 border-b border-[#2A2A3A] shrink-0">
        <p className="text-white text-sm font-bold text-center tracking-wide">Chat da transmissão</p>
      </div>

      {/* Mensagem fixada */}
      {pinnedMessage && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-3 py-2 flex items-start gap-2 shrink-0">
          <Pin className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs flex-1 min-w-0 break-words">
            <span className="font-bold mr-0.5" style={{ color: getUserColor(pinnedMessage.user_name) }}>
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

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {regularMessages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-4">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {regularMessages.map(m => (
          <div key={m.id} className="group text-sm leading-snug flex items-start gap-1 py-0.5">
            <p className="flex-1 min-w-0 break-words">
              <span className="font-bold" style={{ color: getUserColor(m.user_name) }}>{m.user_name}</span>
              <span className="text-gray-400">: </span>
              <span className="text-gray-100">{m.message}</span>
            </p>
            {isAdmin && (
              <div className="shrink-0 flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => pinMessage(m)}
                  className="text-gray-700 hover:text-orange-400 transition-colors"
                  title="Fixar mensagem"
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  onClick={() => blockUser(m.user_name)}
                  disabled={blockedUsers.has(m.user_name)}
                  className={`transition-colors ${blockedUsers.has(m.user_name) ? 'text-yellow-600 cursor-not-allowed' : 'text-gray-700 hover:text-yellow-500'}`}
                  title={blockedUsers.has(m.user_name) ? 'Usuário já bloqueado' : 'Bloquear usuário'}
                >
                  <Ban className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteMessage(m.id)}
                  className="text-gray-700 hover:text-red-500 transition-colors"
                  title="Excluir mensagem"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#2A2A3A] p-3">
        {user ? (
          isBlocked ? (
            <p className="text-center text-red-400 text-xs py-2 px-1">
              Você foi bloqueado de comentar nesta transmissão.
            </p>
          ) : (
            <form onSubmit={send} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={200}
                placeholder="Envie uma mensagem"
                className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-lg px-3 py-2 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )
        ) : (
          <button
            type="button"
            onClick={() => showModal('login')}
            className="block w-full text-center text-gray-500 hover:text-orange-500 text-sm transition-colors py-2"
          >
            Entre para participar do chat
          </button>
        )}
      </div>
    </div>
  )
}
