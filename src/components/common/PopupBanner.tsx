'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type PopupMessage = {
  id: string
  message: string
  active: boolean
}

export default function PopupBanner() {
  const [popup, setPopup] = useState<PopupMessage | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    supabase
      .from('popup_messages')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setPopup(data) })

    const channel = supabase
      .channel('popup-messages-client')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'popup_messages' }, payload => {
        const msg = payload.new as PopupMessage
        if (msg.active) { setPopup(msg); setDismissed(false) }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'popup_messages' }, payload => {
        const msg = payload.new as PopupMessage
        if (!msg.active) setPopup(prev => prev?.id === msg.id ? null : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!popup || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDismissed(true)} />
      <div className="relative w-full max-w-md bg-[#12121A] border border-orange-500/40 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-lg">📢</span>
          </div>
          <div className="flex-1 pr-6">
            <p className="text-orange-400 text-xs font-bold mb-1 uppercase tracking-wide">Aviso</p>
            <p className="text-white text-sm leading-relaxed">{popup.message}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="mt-5 w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
