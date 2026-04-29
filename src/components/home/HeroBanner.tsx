'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Banner = {
  id: string
  image_url: string
  game_id: number | null
}

type GameData = {
  teams: { home: { name: string }; away: { name: string } }
  goals: { home: number | null; away: number | null }
  fixture: { status: { elapsed: number | null; short: string } }
}

export default function HeroBanner() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [game, setGame] = useState<GameData | null>(null)

  useEffect(() => {
    loadBanner()
  }, [])

  async function loadBanner() {
    const { data } = await supabase.from('banner').select('*').single()
    if (!data) return
    setBanner(data)
    if (data.game_id) loadGame(data.game_id)
  }

  async function loadGame(id: number) {
    const res = await fetch(`/api/football/live?id=${id}`)
    const data = await res.json()
    if (data.response?.[0]) setGame(data.response[0])
  }

  if (!banner?.image_url) return null

  const isLive = game?.fixture.status.short === '1H' ||
    game?.fixture.status.short === '2H' ||
    game?.fixture.status.short === 'HT'

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2A2A3A]">
      <img
        src={banner.image_url}
        alt="Banner do jogo em destaque"
        className="w-full object-cover rounded-2xl"
        style={{ maxHeight: 480, minHeight: 200 }}
      />

      {game && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-center gap-4">
            {isLive && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                AO VIVO
              </span>
            )}
            <span className="text-white font-bold text-sm">{game.teams.home.name}</span>
            <span className="bg-[#2A2A3A] text-white font-black px-4 py-1 rounded-xl">
              {game.goals.home ?? 0} — {game.goals.away ?? 0}
            </span>
            <span className="text-white font-bold text-sm">{game.teams.away.name}</span>
            {game.fixture.status.elapsed && (
              <span className="text-orange-500 text-sm font-bold">
                {game.fixture.status.elapsed}'
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
