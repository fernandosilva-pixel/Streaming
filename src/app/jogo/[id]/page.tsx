'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, Lock, DollarSign, Maximize } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { use } from 'react'
import ChatBox from '@/components/player/ChatBox'
import PaymentModal from '@/components/player/PaymentModal'

interface Props {
  params: Promise<{ id: string }>
}

type Stream = {
  id: string
  title: string
  stream_source: 'kick' | 'soop'
  kick_channel: string | null
  soop_channel: string | null
  soop_broad_no: string | null
  crop_enabled: boolean
  charge_enabled: boolean
  charge_amount: number
  payment_method: 'bspay' | 'fixed_qr' | null
  fixed_qr_url: string | null
}

export default function JogoPage({ params }: Props) {
  const { id } = use(params)
  const { user, showModal } = useAuth()
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [isFreeAccess, setIsFreeAccess] = useState(false)

  const [soopBroadNo, setSoopBroadNo] = useState<string | null>(null)
  const [soopLoading, setSoopLoading] = useState(false)
  const [soopOffline, setSoopOffline] = useState(false)

  const [previewActive, setPreviewActive] = useState(true)
  const [previewSeconds, setPreviewSeconds] = useState(150)

  const playerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (!playerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    if (playerRef.current.requestFullscreen) {
      playerRef.current.requestFullscreen()
    }
  }

  useEffect(() => {
    supabase.from('streams').select('*').eq('id', id).single().then(({ data }) => {
      setStream(data)
      setLoading(false)
    })
  }, [id])

  // Auto-detect Sooplive broadcast number when not stored
  useEffect(() => {
    if (!stream || (stream.stream_source ?? 'kick') !== 'soop' || !stream.soop_channel) return

    if (stream.soop_broad_no) {
      setSoopBroadNo(stream.soop_broad_no)
      return
    }

    setSoopLoading(true)
    fetch(`/api/soop/broadcast?bjid=${stream.soop_channel}`)
      .then(res => res.json())
      .then(data => {
        if (data.broad_no) setSoopBroadNo(String(data.broad_no))
        else setSoopOffline(true)
      })
      .catch(() => setSoopOffline(true))
      .finally(() => setSoopLoading(false))
  }, [stream])

  useEffect(() => {
    if (!user || !stream || !stream.charge_enabled) return
    setCheckingPayment(true)
    Promise.all([
      supabase.from('payments').select('id').eq('stream_id', stream.id).eq('user_phone', user.phone).eq('status', 'PAID').maybeSingle(),
      supabase.from('free_access').select('id').eq('user_phone', user.phone).maybeSingle(),
    ]).then(([payment, free]) => {
      setHasPaid(!!payment.data)
      setIsFreeAccess(!!free.data)
      setCheckingPayment(false)
    })
  }, [user, stream])

  // 1-minute preview, separate timer for not-logged-in and logged-in-but-unpaid
  const previewKey = user ? `preview_payment_${id}_${user.phone}` : `preview_login_${id}`

  useEffect(() => {
    const stored = sessionStorage.getItem(previewKey)
    const now = Date.now()
    let endsAt: number

    if (stored) {
      endsAt = parseInt(stored)
      if (endsAt <= now) {
        setPreviewActive(false)
        setPreviewSeconds(0)
        return
      }
    } else {
      endsAt = now + 150_000
      sessionStorage.setItem(previewKey, String(endsAt))
    }

    setPreviewActive(true)
    setPreviewSeconds(Math.ceil((endsAt - now) / 1000))

    const interval = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      if (left <= 0) {
        clearInterval(interval)
        setPreviewActive(false)
        setPreviewSeconds(0)
      } else {
        setPreviewSeconds(left)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [previewKey])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Carregando transmissão...</p>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-white mb-2">Transmissão não encontrada</h1>
        <p className="text-gray-500 mb-6">Esta transmissão não está disponível ou foi encerrada.</p>
        <Link href="/" className="btn-primary inline-flex">Voltar ao início</Link>
      </div>
    )
  }

  const source = stream.stream_source ?? 'kick'

  const cropStyle: React.CSSProperties = stream.crop_enabled ? {
    position: 'absolute',
    top: -65,
    left: 0,
    width: '100%',
    height: 'calc(100% + 130px)',
    border: 'none',
    clipPath: 'inset(65px 0px 65px 0px)',
  } : {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  }

  function renderPlayer(s: NonNullable<typeof stream>, blurred = false) {
    const blurExtra: React.CSSProperties = blurred
      ? { filter: 'blur(18px)', transform: 'scale(1.08)' }
      : {}

    if (source === 'soop') {
      if (soopLoading) {
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0B0F]">
            <p className="text-gray-500 text-sm">Buscando transmissão ao vivo...</p>
          </div>
        )
      }
      if (soopOffline || !soopBroadNo) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0B0B0F]">
            <p className="text-white font-bold">Canal offline</p>
            <p className="text-gray-500 text-sm">A transmissão ainda não começou ou foi encerrada.</p>
          </div>
        )
      }
      return (
        <iframe
          src={`https://play.sooplive.com/${s.soop_channel}/${soopBroadNo}/embed`}
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ ...cropStyle, ...blurExtra }}
        />
      )
    }

    // Kick
    const parent = typeof window !== 'undefined' ? window.location.hostname : ''
    return (
      <iframe
        src={`https://player.kick.com/${s.kick_channel}?autoplay=true&parent=${parent}`}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        style={{ ...cropStyle, ...blurExtra }}
      />
    )
  }

  const wouldNeedLogin = !user
  const wouldNeedPayment = !!user && stream.charge_enabled && !hasPaid && !checkingPayment && !isFreeAccess

  const needsLogin = wouldNeedLogin && !previewActive
  const needsPayment = wouldNeedPayment && !previewActive
  const isBlurred = needsLogin || needsPayment
  const showCountdown = previewActive && (wouldNeedLogin || wouldNeedPayment)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Início
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-white text-sm font-medium">{stream.title}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Player */}
        <div className="xl:col-span-2 space-y-3">
          {/* Hint badge above iframe */}
          <div className="flex items-center justify-center">
            <div className="animate-pulse" style={{ transform: 'skewX(-12deg)', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 6, padding: '3px 14px' }}>
              <span style={{ transform: 'skewX(12deg)', display: 'inline-block' }} className="text-orange-400 text-xs font-semibold">Som desativado? Coloque em tela cheia e aumente o volume.</span>
            </div>
          </div>

          {/* Wrapper fullscreen — ref aqui fora do iframe */}
          <div ref={playerRef} className="relative">
          <div className={!isFullscreen ? 'skew-frame' : ''}>
          <div className={!isFullscreen ? 'skew-frame-inner' : ''}>
          <div
            className="bg-black w-full"
            style={isFullscreen
              ? { position: 'relative', height: '100vh', overflow: 'hidden' }
              : { position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }
            }
          >
            {/* Player — hidden when payment required (stops video and audio completely) */}
            {needsPayment
              ? <div className="absolute inset-0 bg-black" />
              : renderPlayer(stream, isBlurred)
            }

            {/* Overlays: desktop blocks entire iframe, mobile blocks only top strip */}
            {!isBlurred && !needsPayment && (
              <>
                {/* Mobile: only top strip (channel name link) */}
                <div className="absolute top-0 left-0 right-0 z-10 md:hidden" style={{ height: 48 }} />
                {/* Desktop: full overlay — all Kick links/branding blocked */}
                <div className="absolute inset-0 z-10 hidden md:block" />
              </>
            )}


            {/* Login overlay */}
            {needsLogin && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/50">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Conteúdo restrito</p>
                  <p className="text-gray-400 text-sm mt-1">Já tem conta na Futzone? Faça o login e assista agora.</p>
                  <p className="text-gray-400 text-sm mt-0.5">Ainda não tem conta? Crie sua conta e assista agora.</p>
                </div>
                <button
                  className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10"
                  onClick={() => showModal('login')}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {/* Payment overlay */}
            {needsPayment && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/50">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Conteúdo pago</p>
                  <p className="text-white text-sm mt-1">
                    R$ {stream.charge_amount.toFixed(2).replace('.', ',')} via PIX para assistir
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10"
                >
                  Pagar e assistir
                </button>
              </div>
            )}

            {/* Checking payment */}
            {user && stream.charge_enabled && checkingPayment && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-gray-400 text-sm">Verificando acesso...</p>
              </div>
            )}

            {paymentModalOpen && user && stream.charge_enabled && !hasPaid && (
              <PaymentModal
                streamId={stream.id}
                userPhone={user.phone}
                userName={user.name}
                amount={stream.charge_amount}
                paymentMethod={stream.payment_method ?? 'bspay'}
                fixedQrUrl={stream.fixed_qr_url}
                onPaid={() => { setHasPaid(true); setPaymentModalOpen(false) }}
                onClose={() => setPaymentModalOpen(false)}
              />
            )}
          </div>
          </div>
          </div>

          {/* Title + fullscreen button — flush below the iframe */}
          <div className="flex items-center justify-center pt-3 relative">
            <div style={{
              transform: 'skewX(-3deg)',
              border: '1px solid rgba(255,106,0,0.2)',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              padding: '8px 28px',
            }}>
              <div style={{ transform: 'skewX(3deg)' }}>
                <h1 className="text-white font-black text-xl">{stream.title}</h1>
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex absolute right-0 shrink-0 p-2 rounded-lg bg-[#12121A] border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-all animate-orange-pulse"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          </div>

        </div>

        {/* Chat */}
        <div className="xl:col-span-1">
          <div className="sticky top-20" style={{ height: 560, position: 'relative' }}>
            {/* Borda paralelo­grama — desktop only, puramente visual */}
            <div className="hidden xl:block pointer-events-none" style={{
              position: 'absolute', inset: 0, zIndex: 2,
              transform: 'skewX(-3deg)',
              border: '1px solid #2A2A3A',
              borderRadius: 16,
            }} />
            {/* Conteúdo — sem skew, perfeitamente centralizado */}
            <div className="chat-border" style={{ height: '100%', background: '#0B0B0F', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
              <ChatBox streamId={stream.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
