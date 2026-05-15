'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Smile, MessageSquare, Clock, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import EmojiPicker from '@/components/common/EmojiPicker'
import { SupportMsg, loadAllMsgs, saveAllMsgs } from '@/components/home/SupportWidget'

const IS_MOCK = process.env.NEXT_PUBLIC_SUPABASE_MOCK === 'true'
const STATUS_KEY = 'support_statuses'

type TicketStatus = 'open' | 'closed'

interface Conversation {
  session_id: string
  user_name: string
  user_email: string
  last_message: string
  last_at: string
  unread: number
  status: TicketStatus
}

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function loadStatuses(): Record<string, TicketStatus> {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}') } catch { return {} }
}
function saveStatuses(s: Record<string, TicketStatus>) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(s))
  window.dispatchEvent(new StorageEvent('storage', { key: STATUS_KEY, newValue: JSON.stringify(s) }))
}

function seedDemoData() {
  const existing = loadAllMsgs()
  if (existing.length > 0) return
  const now = Date.now()
  const demo: SupportMsg[] = [
    { id: genId(), session_id: 'demo-lucas',    user_name: 'Lucas Mendes',   user_email: 'lucas@gmail.com',      message: 'Oi, tudo bem? Quero saber como funciona o acesso VIP do site',                     is_admin: false, created_at: new Date(now - 3600000 * 2).toISOString() },
    { id: genId(), session_id: 'demo-lucas',    user_name: 'Lucas Mendes',   user_email: 'lucas@gmail.com',      message: 'Consigo assistir os jogos ao vivo pagando quanto?',                                is_admin: false, created_at: new Date(now - 3600000 * 1.8).toISOString() },
    { id: genId(), session_id: 'demo-fernanda', user_name: 'Fernanda Silva', user_email: 'fernanda@hotmail.com', message: 'Boa tarde! O pagamento do jogo do Flamengo foi cobrado mas não consigo assistir',  is_admin: false, created_at: new Date(now - 3600000 * 5).toISOString() },
    { id: genId(), session_id: 'demo-fernanda', user_name: 'Suporte',        user_email: 'suporte@futzone.com',  message: 'Boa tarde Fernanda! Me passa o email usado no cadastro e verificamos agora 😊',    is_admin: true,  created_at: new Date(now - 3600000 * 4.5).toISOString() },
    { id: genId(), session_id: 'demo-fernanda', user_name: 'Fernanda Silva', user_email: 'fernanda@hotmail.com', message: 'fernanda_silva92@hotmail.com, obrigada pelo retorno rápido!',                      is_admin: false, created_at: new Date(now - 3600000 * 4).toISOString() },
    { id: genId(), session_id: 'demo-rafael',   user_name: 'Rafael Costa',   user_email: '',                    message: 'Meu app trava quando tento entrar na transmissão ao vivo, alguém pode me ajudar?', is_admin: false, created_at: new Date(now - 1800000).toISOString() },
    { id: genId(), session_id: 'demo-rafael',   user_name: 'Rafael Costa',   user_email: '',                    message: 'Já tentei limpar o cache e não resolveu 😕',                                       is_admin: false, created_at: new Date(now - 1500000).toISOString() },
  ]
  saveAllMsgs(demo)
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [statuses, setStatuses] = useState<Record<string, TicketStatus>>({})
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMsg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function buildConversations(all: SupportMsg[], sts: Record<string, TicketStatus>): Conversation[] {
    const map = new Map<string, Conversation>()
    all.forEach(m => {
      const existing = map.get(m.session_id)
      const conv: Conversation = existing ?? {
        session_id: m.session_id,
        user_name: m.user_name,
        user_email: m.user_email,
        last_message: '',
        last_at: '',
        unread: 0,
        status: sts[m.session_id] ?? 'open',
      }
      conv.last_message = m.message
      conv.last_at = m.created_at
      conv.status = sts[m.session_id] ?? 'open'
      if (!m.is_admin) conv.unread = (existing?.unread ?? 0) + 1
      else conv.unread = 0
      map.set(m.session_id, conv)
    })
    return Array.from(map.values()).sort((a, b) => b.last_at.localeCompare(a.last_at))
  }

  // Mock mode: seed + localStorage
  useEffect(() => {
    if (!IS_MOCK) return
    seedDemoData()
    const sts = loadStatuses()
    const all = loadAllMsgs()
    setStatuses(sts)
    setConversations(buildConversations(all, sts))
  }, [])

  useEffect(() => {
    if (!IS_MOCK) return
    const handler = (e: StorageEvent) => {
      if (e.key === 'support_messages' && e.newValue) {
        try {
          const all = JSON.parse(e.newValue) as SupportMsg[]
          const sts = loadStatuses()
          setConversations(buildConversations(all, sts))
          if (selected) setMessages(all.filter(m => m.session_id === selected))
        } catch {}
      }
      if (e.key === STATUS_KEY && e.newValue) {
        try {
          const sts = JSON.parse(e.newValue) as Record<string, TicketStatus>
          setStatuses(sts)
          setConversations(prev => prev.map(c => ({ ...c, status: sts[c.session_id] ?? 'open' })))
        } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [selected])

  useEffect(() => {
    if (!IS_MOCK) return
    if (!selected) return
    setMessages(loadAllMsgs().filter(m => m.session_id === selected))
    setConversations(prev => prev.map(c => c.session_id === selected ? { ...c, unread: 0 } : c))
  }, [selected])

  // Production mode: load from Supabase + realtime
  useEffect(() => {
    if (IS_MOCK) return
    async function load() {
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true })
      const { data: sts } = await supabase
        .from('support_statuses')
        .select('session_id, status')
      const stsMap: Record<string, TicketStatus> = {}
      sts?.forEach(s => { stsMap[s.session_id] = s.status as TicketStatus })
      setStatuses(stsMap)
      if (msgs) setConversations(buildConversations(msgs as SupportMsg[], stsMap))
    }
    load()
    const channel = supabase
      .channel('admin-support')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, payload => {
        const msg = payload.new as SupportMsg
        setConversations(prev => {
          const existing = prev.find(c => c.session_id === msg.session_id)
          if (existing) {
            return prev.map(c => c.session_id === msg.session_id
              ? { ...c, last_message: msg.message, last_at: msg.created_at, unread: msg.is_admin ? c.unread : c.unread + 1 }
              : c
            ).sort((a, b) => b.last_at.localeCompare(a.last_at))
          }
          const newConv: Conversation = {
            session_id: msg.session_id, user_name: msg.user_name,
            user_email: msg.user_email, last_message: msg.message,
            last_at: msg.created_at, unread: msg.is_admin ? 0 : 1, status: 'open',
          }
          return [newConv, ...prev]
        })
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          if (prev.length > 0 && prev[0].session_id === msg.session_id) return [...prev, msg]
          return prev
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (IS_MOCK || !selected) return
    supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', selected)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as SupportMsg[]) })
    setConversations(prev => prev.map(c => c.session_id === selected ? { ...c, unread: 0 } : c))
  }, [selected])

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const conv = conversations.find(c => c.session_id === selected)
  const isClosed = conv?.status === 'closed'
  const filtered = conversations.filter(c => filter === 'all' ? true : c.status === filter)

  async function reply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !text.trim() || sending || isClosed) return
    setSending(true)
    const msg: SupportMsg = {
      id: genId(), session_id: selected,
      user_name: 'Suporte', user_email: 'suporte@futzone.com',
      message: text.trim(), is_admin: true,
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

  async function clearClosed() {
    const closedIds = conversations.filter(c => c.status === 'closed').map(c => c.session_id)
    if (closedIds.length === 0) return
    if (!confirm(`Apagar ${closedIds.length} conversa(s) encerrada(s)? Esta ação não pode ser desfeita.`)) return
    if (IS_MOCK) {
      const all = loadAllMsgs().filter(m => !closedIds.includes(m.session_id))
      saveAllMsgs(all)
      const sts = loadStatuses()
      closedIds.forEach(id => delete sts[id])
      saveStatuses(sts)
    } else {
      await fetch('/api/admin/support-clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_ids: closedIds }),
      })
    }
    if (closedIds.includes(selected ?? '')) setSelected(null)
    setConversations(prev => prev.filter(c => c.status !== 'closed'))
    setMessages([])
  }

  async function closeTicket() {
    if (!selected || !conv || closing) return
    setClosing(true)
    const autoMsg: SupportMsg = {
      id: genId(), session_id: selected,
      user_name: 'Suporte', user_email: 'suporte@futzone.com',
      message: '✅ Seu atendimento foi encerrado. Obrigado por entrar em contato com a FutZone! Se precisar de ajuda novamente, é só nos chamar 😊',
      is_admin: true,
      created_at: new Date().toISOString(),
    }
    if (IS_MOCK) {
      const all = loadAllMsgs()
      saveAllMsgs([...all, autoMsg])
      const sts = { ...loadStatuses(), [selected]: 'closed' as TicketStatus }

      saveStatuses(sts)
      setStatuses(sts)
      setConversations(prev => prev.map(c => c.session_id === selected ? { ...c, status: 'closed' } : c))
    } else {
      setMessages(prev => [...prev, autoMsg])
      setConversations(prev => prev.map(c => c.session_id === selected ? { ...c, status: 'closed' } : c))
      await supabase.from('support_messages').insert(autoMsg)
      await supabase.from('support_statuses').upsert({ session_id: selected, status: 'closed' })
    }
    setClosing(false)
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  const openCount = conversations.filter(c => c.status === 'open').length

  return (
    <div className="flex gap-4" style={{ height: 580 }}>

      {/* Lista de conversas */}
      <div className="w-64 shrink-0 flex flex-col rounded-2xl overflow-hidden border border-[#2A2A3A] bg-[#0E0E16]">
        <div className="px-4 py-3 border-b border-[#2A2A3A] space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-sm">Conversas</h3>
            <div className="flex items-center gap-1.5">
              {openCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{openCount}</span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {([['open','Abertos'],['closed','Fechados'],['all','Todos']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: filter === val ? 'rgba(255,106,0,0.2)' : 'rgba(255,255,255,0.04)',
                  color: filter === val ? '#FF6A00' : '#6b7280',
                  border: `1px solid ${filter === val ? 'rgba(255,106,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                {label}
              </button>
            ))}
          </div>
          {conversations.some(c => c.status === 'closed') && (
            <button
              onClick={clearClosed}
              className="w-full py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              Limpar encerrados
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-gray-700" />
              <p className="text-gray-600 text-xs">Nenhuma conversa</p>
            </div>
          )}
          {filtered.map(c => (
            <button key={c.session_id} onClick={() => setSelected(c.session_id)}
              className="w-full flex items-center gap-2.5 px-3 py-3 border-b border-white/5 text-left transition-all hover:bg-white/5"
              style={{ background: selected === c.session_id ? 'rgba(255,106,0,0.08)' : 'transparent' }}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
                  style={{ background: c.status === 'closed' ? 'rgba(255,255,255,0.05)' : 'rgba(255,106,0,0.2)', color: c.status === 'closed' ? '#6b7280' : '#FF6A00' }}>
                  {c.user_name.slice(0, 1).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0E0E16]"
                  style={{ background: c.status === 'closed' ? '#6b7280' : '#22c55e' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-bold truncate ${c.status === 'closed' ? 'text-gray-500' : 'text-white'}`}>{c.user_name}</p>
                  {c.unread > 0 && c.status === 'open' && (
                    <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center px-1">{c.unread}</span>
                  )}
                  {c.status === 'closed' && (
                    <span className="text-[9px] text-gray-600 font-bold shrink-0">encerrado</span>
                  )}
                </div>
                <p className="text-gray-600 text-[10px] truncate">{c.last_message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[#2A2A3A] bg-[#0E0E16]">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="w-10 h-10 text-gray-700" />
            <p className="text-gray-500 text-sm font-semibold">Selecione uma conversa</p>
            <p className="text-gray-700 text-xs">Clique num usuário à esquerda</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[#2A2A3A] flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ background: isClosed ? 'rgba(255,255,255,0.05)' : 'rgba(255,106,0,0.2)', color: isClosed ? '#6b7280' : '#FF6A00' }}>
                  {conv?.user_name.slice(0, 1).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0E0E16]"
                  style={{ background: isClosed ? '#6b7280' : '#22c55e' }} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{conv?.user_name}</p>
                <p className="text-gray-600 text-[10px]">{conv?.user_email || 'Sem email'}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={isClosed
                    ? { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }
                    : { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {isClosed ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {isClosed ? 'Encerrado' : 'Aberto'}
                </span>
                {!isClosed && (
                  <button onClick={closeTicket} disabled={closing}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <XCircle className="w-3.5 h-3.5" />
                    {closing ? 'Encerrando...' : 'Fechar ticket'}
                  </button>
                )}
                <span className="flex items-center gap-1 text-gray-600 text-[10px]">
                  <Clock className="w-3 h-3" />
                  {conv && formatTime(conv.last_at)}
                </span>
              </div>
            </div>

            <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                    style={m.is_admin ? {
                      background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                      color: '#fff', borderBottomRightRadius: 4,
                    } : {
                      background: 'rgba(255,255,255,0.07)',
                      color: '#e5e7eb', borderBottomLeftRadius: 4,
                    }}>
                    {!m.is_admin && <p className="text-orange-400 text-[10px] font-black mb-0.5">{m.user_name}</p>}
                    {m.message}
                    <p className="text-[9px] mt-1 opacity-50 text-right">{formatTime(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>

            {isClosed ? (
              <div className="px-4 py-4 border-t border-[#2A2A3A] flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <XCircle className="w-4 h-4 text-gray-600" />
                <p className="text-gray-500 text-xs font-semibold">Ticket encerrado — não é possível enviar mais mensagens</p>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-[#2A2A3A]">
                <form onSubmit={reply} className="flex items-center gap-2 relative">
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
                  <input ref={inputRef} type="text" value={text}
                    onChange={e => setText(e.target.value)} maxLength={500}
                    placeholder="Responder como Suporte..."
                    className="flex-1 bg-[#1A1A26] border border-[#2A2A3A] text-white rounded-xl px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-xl px-3 py-2 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
