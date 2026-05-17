'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, Lock, DollarSign, Maximize } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { use } from 'react'
import ChatBox from '@/components/player/ChatBox'
import PaymentModal from '@/components/player/PaymentModal'
import CombinedModal from '@/components/player/CombinedModal'
import HlsPlayer from '@/components/player/HlsPlayer'
import NewsSection from '@/components/home/NewsSection'

interface Props {
  params: Promise<{ id: string }>
}

type Stream = {
  id: string
  title: string
  stream_source: 'kick' | 'soop' | 'hls' | 'youtube'
  kick_channel: string | null
  soop_channel: string | null
  soop_broad_no: string | null
  hls_url: string | null
  youtube_url: string | null
  crop_enabled: boolean
  charge_enabled: boolean
  charge_amount: number
  payment_method: 'bspay' | 'fixed_qr' | 'ironpay' | null
  fixed_qr_url: string | null
  chat_enabled: boolean
  coupon_enabled: boolean
  coupon_code: string | null
  coupon_quantity: number
}

export default function JogoPage({ params }: Props) {
  const { id } = use(params)
  const { user, showModal, loginDirect } = useAuth()
  const { t } = useLanguage()
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [isFreeAccess, setIsFreeAccess] = useState(false)
  const [hasCoupon, setHasCoupon] = useState(false)
  const [isTargetCharged, setIsTargetCharged] = useState(false)
  const [targetPaymentMethod, setTargetPaymentMethod] = useState<'bspay' | 'fixed_qr' | 'ironpay' | null>(null)
  const [targetChargeAmount, setTargetChargeAmount] = useState<number | null>(null)

  const [soopBroadNo, setSoopBroadNo] = useState<string | null>(null)
  const [soopLoading, setSoopLoading] = useState(false)
  const [soopOffline, setSoopOffline] = useState(false)

  const [previewActive, setPreviewActive] = useState(true)
  const [previewSeconds, setPreviewSeconds] = useState(300)

  const playerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const userRef = useRef(user)
  const streamRef = useRef(stream)
  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { streamRef.current = stream }, [stream])

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

  // Check if this user is individually targeted for payment
  useEffect(() => {
    if (!user || !stream) return
    supabase
      .from('stream_charged_users')
      .select('id, payment_method, charge_amount')
      .eq('stream_id', stream.id)
      .eq('user_email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        setIsTargetCharged(!!data)
        if (data) {
          setTargetPaymentMethod((data.payment_method as 'bspay' | 'ironpay' | 'fixed_qr') ?? null)
          setTargetChargeAmount(data.charge_amount ?? null)
        }
      })
  }, [user, stream])

  useEffect(() => {
    if (!user || !stream) return
    const needsPaymentCheck = stream.charge_enabled || isTargetCharged
    if (!needsPaymentCheck) return
    setCheckingPayment(true)
    Promise.all([
      supabase.from('payments').select('id').eq('stream_id', stream.id).eq('user_phone', user.email).eq('status', 'PAID').maybeSingle(),
      (() => {
        // BR users have email like "5512997208763@futzone.app" — also match by phone digits
        const phone = user.email.endsWith('@futzone.app') ? user.email.split('@')[0] : null
        const filter = phone
          ? supabase.from('free_access').select('id').or(`user_phone.eq.${user.email},user_phone.eq.${phone}`)
          : supabase.from('free_access').select('id').eq('user_phone', user.email)
        return filter.maybeSingle()
      })(),
      supabase.from('coupon_uses').select('id').eq('stream_id', stream.id).eq('user_phone', user.email).maybeSingle(),
    ]).then(([payment, free, coupon]) => {
      setHasPaid(!!payment.data)
      setIsFreeAccess(!!free.data)
      setHasCoupon(!!coupon.data)
      setCheckingPayment(false)
    })
  }, [user, stream, isTargetCharged])

  // ── CAMADA 2: Polling contínuo no DB a cada 4s (independente do modal) ──────
  // Garante liberação mesmo que o modal tenha sido fechado antes da confirmação
  useEffect(() => {
    if (!user || !(stream?.charge_enabled || isTargetCharged) || hasPaid || isFreeAccess || hasCoupon) return

    async function recheckDB() {
      const { data } = await supabase
        .from('payments')
        .select('id')
        .eq('stream_id', stream!.id)
        .eq('user_phone', user!.email)
        .eq('status', 'PAID')
        .maybeSingle()
      if (data) setHasPaid(true)
    }

    const interval = setInterval(recheckDB, 4000)

    const onVisibility = () => { if (document.visibilityState === 'visible') recheckDB() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user, stream, isTargetCharged, hasPaid, isFreeAccess, hasCoupon])

  // ── CAMADA 4: Realtime Supabase — libera instantaneamente quando webhook atualiza ──
  useEffect(() => {
    if (!user || !(stream?.charge_enabled || isTargetCharged) || hasPaid || isFreeAccess || hasCoupon) return

    const channel = supabase
      .channel(`pay-watch:${id}:${user.email}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `stream_id=eq.${id}`,
      }, (payload) => {
        const row = payload.new as { user_phone: string; status: string }
        if (row.user_phone === user.email && row.status === 'PAID') setHasPaid(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, stream, isTargetCharged, hasPaid, isFreeAccess, hasCoupon, id])

  // Track presence only when user is confirmed watching (logged in + paid/free)
  useEffect(() => {
    if (!stream) return
    const canWatch = !!user && !checkingPayment && (!(stream.charge_enabled || isTargetCharged) || hasPaid || isFreeAccess || hasCoupon)
    if (!canWatch) return

    let sid = sessionStorage.getItem('futzone_sid')
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('futzone_sid', sid) }

    const channel = supabase.channel('site-presence', {
      config: { presence: { key: sid } },
    })
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        let country = ''
        let flag = ''
        try {
          const geo = await fetch('https://ipinfo.io/json?token=').then(r => r.json())
          country = geo.country ?? ''
          flag = geo.country ? `https://flagcdn.com/24x18/${geo.country.toLowerCase()}.png` : ''
        } catch {}
        await channel.track({ stream_id: id, name: user.name, phone: user.email, country, flag, at: Date.now() })
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [user, stream, hasPaid, isFreeAccess, checkingPayment, id])

  // Exit fullscreen when login/payment overlay needs to appear (overlay is outside native video fullscreen element)
  useEffect(() => {
    if (previewActive) return
    const needsLogin = !user
    const needsPayment = !!user && !!stream?.charge_enabled && !hasPaid && !checkingPayment && !isFreeAccess && !hasCoupon
    if ((needsLogin || needsPayment) && document.fullscreenElement) {
      document.exitFullscreen()
    }
  }, [user, stream, hasPaid, checkingPayment, isFreeAccess, previewActive])

  // Block preview for logged-in users who already used it (cross-browser)
  useEffect(() => {
    if (!user || !stream || !(stream.charge_enabled || isTargetCharged)) return
    supabase.from('preview_used')
      .select('user_phone')
      .eq('user_phone', user.email)
      .eq('stream_id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPreviewActive(false)
          setPreviewSeconds(0)
          sessionStorage.setItem(`preview_payment_${id}_${user.email}`, '0')
        }
      })
  }, [user?.email, id, stream?.charge_enabled])

  // Poll for admin-triggered force refresh every 5s (stream-level)
  useEffect(() => {
    let initialized = false
    let lastRefreshAt: string | null = null
    const interval = setInterval(async () => {
      const { data } = await supabase.from('streams').select('force_refresh_at').eq('id', id).single()
      const val = data?.force_refresh_at ?? null
      if (!initialized) { initialized = true; lastRefreshAt = val; return }
      if (val !== lastRefreshAt) window.location.reload()
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  // Poll for admin-triggered user-level force refresh every 5s
  useEffect(() => {
    if (!user) return
    let lastRefreshAt: string | null = null
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('user_refresh')
        .select('refresh_at')
        .eq('stream_id', id)
        .eq('user_email', user.email)
        .maybeSingle()
      const val = data?.refresh_at ?? null
      if (lastRefreshAt === null) { lastRefreshAt = val; return }
      if (val !== lastRefreshAt) window.location.reload()
    }, 5000)
    return () => clearInterval(interval)
  }, [user, id])

  // 2m30s preview, separate timer for not-logged-in and logged-in-but-unpaid
  const previewKey = user ? `preview_payment_${id}_${user.email}` : `preview_login_${id}`

  useEffect(() => {
    const stored = localStorage.getItem(previewKey)
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
      endsAt = now + 300_000
      localStorage.setItem(previewKey, String(endsAt))
    }

    setPreviewActive(true)
    setPreviewSeconds(Math.ceil((endsAt - now) / 1000))

    const interval = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      if (left <= 0) {
        clearInterval(interval)
        setPreviewActive(false)
        setPreviewSeconds(0)
        // Persist for logged-in users so other browsers also block
        const u = userRef.current
        const s = streamRef.current
        if (u && (s?.charge_enabled || isTargetCharged)) {
          fetch('/api/preview/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_phone: u.email, stream_id: id }),
          })
        }
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

    if (source === 'youtube') {
      if (!s.youtube_url) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0B0B0F]">
            <p className="text-white font-bold">URL do YouTube não configurada</p>
          </div>
        )
      }
      return (
        <iframe
          src={`https://www.youtube.com/embed/${s.youtube_url}?autoplay=1`}
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', ...blurExtra }}
        />
      )
    }

    if (source === 'hls') {
      if (!s.hls_url) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0B0B0F]">
            <p className="text-white font-bold">URL HLS não configurada</p>
          </div>
        )
      }
      return (
        <HlsPlayer
          src={s.hls_url}
          style={{ ...cropStyle, ...blurExtra }}
        />
      )
    }

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
  const wouldNeedPayment = !!user && (stream.charge_enabled || isTargetCharged) && !hasPaid && !checkingPayment && !isFreeAccess && !hasCoupon

  const needsLogin = wouldNeedLogin && !previewActive
  const needsPayment = wouldNeedPayment && !previewActive
  const isBlurred = needsLogin || needsPayment
  const showCountdown = previewActive && (wouldNeedLogin || wouldNeedPayment)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
            Início
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-white text-sm font-medium truncate">{stream.title}</span>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Player */}
        <div className="xl:col-span-2 space-y-3">
          {/* Hint badge — centralizado acima do iframe */}
          <div className="flex items-center justify-center">
            <div className="animate-pulse" style={{ transform: 'skewX(-12deg)', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 6, padding: '3px 14px' }}>
              <span style={{ transform: 'skewX(12deg)', display: 'inline-block' }} className="text-orange-400 text-xs font-semibold">{t('soundHint')}</span>
            </div>
          </div>
          {/* Wrapper fullscreen — ref aqui fora do iframe */}
          <div ref={playerRef} className="relative">
          <div
            className="rounded-xl border border-[#2A2A3A] bg-black w-full"
            style={isFullscreen
              ? { position: 'relative', height: '100vh', overflow: 'hidden' }
              : { position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }
            }
          >
            {/* Player — hidden when login or payment required (stops video and audio completely) */}
            {needsPayment || needsLogin
              ? <div className="absolute inset-0 bg-black" />
              : renderPlayer(stream, isBlurred)
            }

            {/* Overlays: desktop blocks entire iframe, mobile blocks only top strip — not needed for HLS (native video element) */}
            {!isBlurred && !needsPayment && source !== 'hls' && (
              <>
                {/* Mobile: only top strip (channel name link) */}
                <div className="absolute top-0 left-0 right-0 z-10 md:hidden" style={{ height: 48 }} />
                {/* Desktop: full overlay — all Kick/Soop/YouTube links/branding blocked */}
                <div className="absolute inset-0 z-10 hidden md:block" />
              </>
            )}


            {/* Login overlay — free stream */}
            {needsLogin && !stream.charge_enabled && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/50">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{t('restrictedContent')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('restrictedLogin')}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{t('restrictedNoAccount')}</p>
                </div>
                <button
                  className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10"
                  onClick={() => showModal('login')}
                >
                  {t('createAccount')}
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
                  <p className="text-white font-bold text-lg">{t('paidContent')}</p>
                  <p className="text-white text-sm mt-1">
                    R$ {(targetChargeAmount ?? stream.charge_amount).toFixed(2).replace('.', ',')} {t('viaPix')}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10"
                >
                  {t('payAndWatch')}
                </button>
              </div>
            )}

            {/* Checking payment */}
            {user && stream.charge_enabled && checkingPayment && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-gray-400 text-sm">{t('checkingAccess')}</p>
              </div>
            )}

            {paymentModalOpen && user && (stream.charge_enabled || isTargetCharged) && !hasPaid && (
              <PaymentModal
                streamId={stream.id}
                userEmail={user.email}
                userName={user.name}
                amount={targetChargeAmount ?? stream.charge_amount}
                paymentMethod={targetPaymentMethod ?? stream.payment_method ?? 'bspay'}
                fixedQrUrl={stream.fixed_qr_url}
                couponEnabled={stream.coupon_enabled}
                onPaid={() => { setHasPaid(true); setPaymentModalOpen(false) }}
                onCouponSuccess={() => { setHasCoupon(true); setPaymentModalOpen(false) }}
                onClose={() => setPaymentModalOpen(false)}
              />
            )}

            {/* Combined modal for non-logged-in users on paid streams */}
            {needsLogin && stream.charge_enabled && (
              <CombinedModal
                streamId={stream.id}
                amount={stream.charge_amount}
                paymentMethod={stream.payment_method ?? 'bspay'}
                fixedQrUrl={stream.fixed_qr_url}
                couponEnabled={stream.coupon_enabled}
                onSuccess={(userObj) => { loginDirect(userObj); setHasPaid(true) }}
                onCouponSuccess={(userObj) => { loginDirect(userObj); setHasCoupon(true) }}
                onClose={() => {}}
              />
            )}
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
            {source !== 'hls' && (
              <button
                onClick={toggleFullscreen}
                className="hidden md:flex absolute right-0 shrink-0 p-2 rounded-lg bg-[#12121A] border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-all animate-orange-pulse"
              >
                <Maximize className="w-4 h-4" />
              </button>
            )}
          </div>
          </div>

        </div>

        {/* Chat */}
        <div className="xl:col-span-1">
          <div className="sticky top-20 rounded-xl overflow-hidden border border-[#2A2A3A] bg-[#0B0B0F]" style={{ height: 560 }}>
            {stream.chat_enabled !== false
              ? <ChatBox streamId={stream.id} />
              : <div className="flex items-center justify-center h-full"><p className="text-gray-500 text-sm">Chat desativado.</p></div>
            }
          </div>
        </div>
      </div>

      {/* Horizontal banner section — same as homepage */}
      <div className="mt-6">
        <NewsSection />
      </div>
    </div>
  )
}
