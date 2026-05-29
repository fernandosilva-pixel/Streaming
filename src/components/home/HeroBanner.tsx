'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Substitua pelo ID do vídeo do YouTube que quiser exibir
const PROMO_VIDEO_ID = ''

type LiveStream = {
  id: string
  title: string
  category: string | null
}

const STATS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    value: '100+',
    label: 'jogos ao vivo / mês',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    value: '7+',
    label: 'anos no mercado',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    ),
    value: 'HD/FHD',
    label: 'qualidade de stream',
  },
]

export default function HeroBanner() {
  const router = useRouter()
  const { user, showModal } = useAuth()
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])

  useEffect(() => {
    supabase.from('streams').select('id, title, category').eq('is_live', true).then(({ data }) => {
      setLiveStreams(data ?? [])
    })
  }, [])

  const filteredStreams = liveStreams.filter(s => {
    const storedSport = typeof window !== 'undefined' ? localStorage.getItem('futzone_sport') : null
    const pref = user?.content_preference ?? (storedSport as string | null) ?? 'luta'
    if (pref === 'luta') return true
    return !s.category || s.category === pref
  })

  function handleCTA() {
    if (!user) {
      showModal('register')
    } else if (filteredStreams.length > 0) {
      router.push(`/jogo/${filteredStreams[0].id}`)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Fundo: grid tech */}
      <div
        className="absolute inset-0"
        style={{
          background: '#080F1C',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />
      {/* Glow vermelho suave à esquerda */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65% 90% at -5% 50%, rgba(227,6,19,0.11) 0%, transparent 60%)',
        }}
      />
      {/* Borda superior luminosa */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(227,6,19,0.4) 0%, rgba(227,6,19,0.08) 40%, transparent 70%)' }}
      />

      <div className="relative z-10 p-6 sm:p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-10 items-center">

          {/* ── Coluna esquerda ── */}
          <div className="flex flex-col gap-5">

            {/* Badge ao vivo */}
            {filteredStreams.length > 0 && (
              <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E30613]" style={{ animation: 'livePulse 1.5s ease-in-out infinite' }} />
                <span className="text-[11px] font-bold text-[#E30613] uppercase tracking-[0.12em]">
                  {filteredStreams.length} jogo{filteredStreams.length > 1 ? 's' : ''} ao vivo agora
                </span>
              </div>
            )}

            {/* Headline */}
            <div className="space-y-1">
              <h1 className="text-[2.8rem] sm:text-5xl lg:text-6xl xl:text-[4rem] font-black leading-[1.02] tracking-tight text-white">
                O melhor futebol
              </h1>
              <h1
                className="text-[2.8rem] sm:text-5xl lg:text-6xl xl:text-[4rem] font-black leading-[1.02] tracking-tight"
                style={{
                  background: 'linear-gradient(130deg, #FF2233 0%, #E30613 50%, #B0000F 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ao vivo.
              </h1>
            </div>

            {/* Subtítulo */}
            <p className="text-[15px] lg:text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Transmissões em HD sem travar. Champions League,
              Brasileirão, Premier League e muito mais.
            </p>

            {/* CTA */}
            <button
              onClick={handleCTA}
              className="group inline-flex items-center gap-3 w-fit px-7 py-3.5 rounded-lg font-bold text-sm uppercase tracking-[0.1em] text-white transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #E30613 0%, #B0000F 100%)',
                boxShadow: '0 0 28px rgba(227,6,19,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              Conhecer os planos
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </button>

            {/* Contador de espectadores */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {(['#C8102E', '#1A3C6E', '#004812', '#FFD700'] as const).map((bg, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold text-white select-none"
                    style={{ background: bg, borderColor: '#080F1C', zIndex: 4 - i }}
                  >
                    {['C', 'M', 'J', '+'][i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="text-white font-semibold">1.2k+</span> assistindo agora
                </span>
              </div>
            </div>

            {/* Atalhos para jogos ao vivo */}
            {filteredStreams.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {filteredStreams.slice(0, 3).map(s => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/jogo/${s.id}`)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:brightness-125"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E30613]" style={{ animation: 'livePulse 1.5s ease-in-out infinite' }} />
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Coluna direita: player ── */}
          <div className="relative">
            {/* Glow atrás do player */}
            <div
              className="absolute -inset-4 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(227,6,19,0.07) 0%, transparent 70%)' }}
            />
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: '#060D18',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 0 1px rgba(227,6,19,0.08), 0 24px 64px rgba(0,0,0,0.55)',
              }}
            >
              {/* Chrome superior */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'rgba(227,6,19,0.12)', border: '1px solid rgba(227,6,19,0.2)' }}
                >
                  ⚽
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                    {filteredStreams[0]?.title ?? 'FutZone — Transmissão ao Vivo'}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>FutZone</p>
                </div>
              </div>

              {/* Área de vídeo */}
              <div className="relative" style={{ aspectRatio: '16/9', background: '#030810' }}>
                {PROMO_VIDEO_ID ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${PROMO_VIDEO_ID}?rel=0&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  /* Placeholder quando sem vídeo configurado */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(227,6,19,0.12)', border: '1px solid rgba(227,6,19,0.25)' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#E30613] ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Configure <code className="font-mono">PROMO_VIDEO_ID</code> em HeroBanner.tsx
                    </p>
                  </div>
                )}
              </div>

              {/* Chrome inferior */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <button className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                  <button className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </button>
                </div>
                <span className="text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  futzone
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Mais vídeos</span>
                  <div className="flex items-center justify-center w-6 h-4 rounded-sm bg-[#FF0000]">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          className="grid grid-cols-3 gap-4 mt-8 pt-7"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {STATS.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 text-[#E30613]">{stat.icon}</div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white leading-none">{stat.value}</p>
                <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
              </div>
              {i < 2 && (
                <div className="hidden lg:block ml-auto w-px h-7 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
