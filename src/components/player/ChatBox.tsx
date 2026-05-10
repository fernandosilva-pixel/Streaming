'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Send, Trash2 } from 'lucide-react'

type Message = {
  id: string
  user_name: string
  message: string
  created_at: string
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
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.email) { setIsAdmin(false); return }
    supabase
      .from('registrations')
      .select('is_admin')
      .eq('email', user.email)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false))
  }, [user?.email])

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data ?? []))

    const channel = supabase
      .channel(`chat:${streamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${streamId}` },
        payload => setMessages(prev => [...prev, payload.new as Message])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        payload => setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamId])

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    if (!user) { showModal(); return }
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

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#0f0f13] px-4 py-3 border-b border-[#2A2A3A] shrink-0">
        <p className="text-white text-sm font-bold text-center tracking-wide">Chat da transmissão</p>
      </div>

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-4">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className="group text-sm leading-snug flex items-start gap-1 py-0.5">
            <p className="flex-1 min-w-0 break-words">
              <span className="font-bold" style={{ color: getUserColor(m.user_name) }}>{m.user_name}</span>
              <span className="text-gray-400">: </span>
              <span className="text-gray-100">{m.message}</span>
            </p>
            {isAdmin && (
              <button
                onClick={() => deleteMessage(m.id)}
                className="shrink-0 mt-0.5 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Excluir mensagem"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#2A2A3A] p-3">
        {user ? (
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
