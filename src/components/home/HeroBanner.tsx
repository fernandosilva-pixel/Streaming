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
  const { user, showModal } = useAuth()
  const [banner, setBanner] = useState<Banner | null>(null)
  const [game, setGame] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanner()
  }, [])

  async function loadBanner() {
    const { data } = await supabase.from('banner').select('*').single()
    setBanner(data)
    setLoading(false)
    if (data?.game_id) loadGame(data.game_id)
  }

  async function loadGame(id: number) {
    const res = await fetch(`/api/football/live?id=${id}`)
    const data = await res.json()
    if (data.response?.[0]) setGame(data.response[0])
  }

  const isLive = game?.fixture.status.short === '1H' ||
    game?.fixture.status.short === '2H' ||
    game?.fixture.status.short === 'HT'

  if (loading) {
    return (
      <section className="w-full rounded-2xl border border-[#2A2A3A] bg-[#12121A] animate-pulse" style={{ height: 480 }} />
    )
  }

  if (!banner?.image_url) {
    return (
      <section className="w-full rounded-2xl border border-dashed border-[#2A2A3A] bg-[#12121A] flex flex-col items-center justify-center gap-6" style={{ height: 480 }}>
        <p className="text-gray-600 text-sm">Nenhum banner configurado</p>
        <button
          onClick={() => { if (user) { /* sem jogo configurado */ } else { showModal() } }}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,106,0,0.4)]"
        >
          ▶ Assistir Agora
        </button>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2A2A3A]">
      <img
        src={banner.image_url}
        alt="Banner do jogo em destaque"
        className="w-full object-cover rounded-2xl"
        style={{ height: 480, objectPosition: 'center' }}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-6 py-5 rounded-b-2xl">
        {game && (
          <div className="flex items-center justify-center gap-4 mb-4">
            {isLive && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                AO VIVO
              </span>
            )}
            <span className="text-white font-bold">{game.teams.home.name}</span>
            <span className="bg-[#2A2A3A] text-white font-black px-4 py-1.5 rounded-xl text-lg tabular-nums">
              {game.goals.home ?? 0} — {game.goals.away ?? 0}
            </span>
            <span className="text-white font-bold">{game.teams.away.name}</span>
            {game.fixture.status.elapsed && (
              <span className="text-orange-500 font-bold">{game.fixture.status.elapsed}'</span>
            )}
          </div>
        )}
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (user) {
                if (banner.stream_id) router.push(`/jogo/${banner.stream_id}`)
              } else {
                showModal()
              }
            }}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,106,0,0.4)]"
          >
            ▶ Assistir Agora
          </button>
        </div>
      </div>
    </section>
  )
}
