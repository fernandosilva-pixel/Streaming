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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={() => setDismissed(true)}
      />

      {/* Outer skewed wrapper */}
      <div
        className="relative overflow-hidden"
        style={{
          transform: 'skewX(-3deg)',
          border: '1px solid rgba(255,106,0,0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: 360,
          background: 'rgba(18, 18, 28, 0.55)',
          backdropFilter: 'blur(48px) saturate(180%)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Inner counter-skew */}
        <div
          className="flex flex-col items-center gap-5 px-7 py-8"
          style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%' }}
        >
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-5 text-white/30 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex justify-center w-full pt-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ height: 36, width: 'auto', maxWidth: 140, objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <div className="h-9 w-28 rounded-lg bg-white/5" />
            )}
          </div>

          {/* Icon + label */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">Aviso</p>
          </div>

          {/* Message */}
          <p className="text-white/90 text-sm leading-relaxed text-center whitespace-pre-wrap">{popup.message}</p>

          {/* Skewed "Entendi" button */}
          <div className="pt-1 pb-1">
            <button
              onClick={() => setDismissed(true)}
              className="relative font-extrabold text-white uppercase tracking-wide px-10 py-3 transition-all group"
              style={{ transform: 'skewX(-12deg)' }}
            >
              <span
                className="absolute inset-0 rounded-md group-hover:brightness-110 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                  boxShadow: '0 0 18px rgba(255,106,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
                aria-hidden
              />
              <span className="relative text-sm" style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>
                Entendi
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
