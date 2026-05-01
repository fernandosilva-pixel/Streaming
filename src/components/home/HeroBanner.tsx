'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Banner = {
  id: string
  image_url: string
  game_id: number | null
  stream_id: string | null
}

type GameData = {
  teams: { home: { name: string }; away: { name: string } }
  goals: { home: number | null; away: number | null }
  fixture: { status: { elapsed: number | null; short: string } }
}

export default function HeroBanner() {
  const router = useRouter()
  const { showModal } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [game, setGame] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('banner').select('*').order('id').then(({ data }) => {
      const list = (data ?? []).filter(b => b.image_url)
      setBanners(list)
      setLoading(false)
      // carrega placar do banner principal (primeiro)
      if (list[0]?.game_id) {
        fetch(`/api/football/live?id=${list[0].game_id}`)
          .then(r => r.json())
          .then(d => { if (d.response?.[0]) setGame(d.response[0]) })
          .catch(() => {})
      }
    })
  }, [])

  // rotação automática a cada 5s quando há mais de um banner
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  const isLive = game?.fixture.status.short === '1H' ||
    game?.fixture.status.short === '2H' ||
    game?.fixture.status.short === 'HT'

  if (loading) {
    return <section className="w-full rounded-2xl border border-[#2A2A3A] bg-[#12121A] animate-pulse h-40 md:h-96 lg:h-[480px]" />
  }

  if (banners.length === 0) {
    return (
      <section className="w-full rounded-2xl border border-dashed border-[#2A2A3A] bg-[#12121A] flex flex-col items-center justify-center gap-6 h-48 sm:h-72 md:h-96 lg:h-[480px]">
        <p className="text-gray-600 text-sm">Nenhum banner configurado</p>
        <button onClick={() => showModal()} className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10">
          Assistir Agora
        </button>
      </section>
    )
  }

  const banner = banners[currentIndex]

  return (
    <div
      className="overflow-hidden"
      style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '16px' }}
    >
      <section style={{ transform: 'skewX(3deg)', width: '110%', marginLeft: '-5%' }}>
        <div className="relative">
          <img
            src={banner.image_url}
            alt="Banner do jogo em destaque"
            className="w-full block h-auto md:h-96 lg:h-[480px] md:object-cover"
            style={{ objectPosition: 'center' }}
          />

          {currentIndex === 0 && game && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {isLive && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">AO VIVO</span>}
                <span className="text-white font-bold">{game.teams.home.name}</span>
                <span className="bg-[#2A2A3A] text-white font-black px-4 py-1.5 rounded-xl text-lg tabular-nums">
                  {game.goals.home ?? 0} — {game.goals.away ?? 0}
                </span>
                <span className="text-white font-bold">{game.teams.away.name}</span>
                {game.fixture.status.elapsed && <span className="text-orange-500 font-bold">{game.fixture.status.elapsed}'</span>}
              </div>
            </div>
          )}

          {banners.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all ${i === currentIndex ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#12121A]/40 border-t border-[#2A2A3A]/50 px-6 py-4 flex justify-center backdrop-blur-sm">
          <button
            onClick={() => {
              const streamId = banners[0]?.stream_id
              if (streamId) router.push(`/jogo/${streamId}`)
            }}
            className="animate-orange-pulse text-orange-500 font-bold border border-orange-500 rounded-full px-8 py-3 transition-all hover:bg-orange-500/10"
          >
            Assistir Agora
          </button>
        </div>
      </section>
    </div>
  )
}
