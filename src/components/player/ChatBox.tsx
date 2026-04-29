'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Send } from 'lucide-react'

type Message = {
  id: string
  user_name: string
  message: string
  created_at: string
}

export default function ChatBox({ streamId }: { streamId: string }) {
  const { user, showModal } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#1A1A26] px-4 py-2.5 border-b border-[#2A2A3A] shrink-0">
        <p className="text-white text-sm font-bold">Chat ao vivo</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-4">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className="text-sm leading-snug">
            <span className="text-orange-400 font-bold">{m.user_name}</span>
            <span className="text-gray-600 text-[10px] ml-1.5">{formatTime(m.created_at)}</span>
            <p className="text-gray-200 mt-0.5 break-words">{m.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="shrink-0 border-t border-[#2A2A3A] p-3 flex gap-2">
        {user ? (
          <>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={200}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-[#0B0B0F] border border-[#2A2A3A] text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-lg px-3 py-2 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={showModal}
            className="w-full text-center text-gray-500 hover:text-orange-500 text-sm transition-colors py-2"
          >
            Entre para participar do chat
          </button>
        )}
      </form>
    </div>
  )
}
