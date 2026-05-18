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
  category: 'futebol' | 'basquete' | null
}

type LiveStream = {
  id: string
  title: string
  category: string | null
}

export default function HeroBanner() {
  const router = useRouter()
  const { user } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])

  useEffect(() => {
    supabase.from('streams').select('id, title, category').eq('is_live', true).then(({ data }) => {
      setLiveStreams(data ?? [])
    })
  }, [])

  useEffect(() => {
    const storedSport = typeof window !== 'undefined' ? localStorage.getItem('futzone_sport') : null
    const pref = user?.content_preference ?? (storedSport as 'futebol' | 'basquete' | 'luta' | null) ?? 'luta'
    supabase.from('banner').select('*').order('display_order').then(({ data }) => {
      const list = (data ?? []).filter(b => {
        if (!b.image_url) return false
        if (pref === 'luta') return true
        return !b.category || b.category === pref
      })
      setBanners(list)
      setLoading(false)
    })
  }, [user?.content_preference])

  // rotação automática a cada 5s quando há mais de um banner
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  if (loading) {
    return <section className="w-full rounded-2xl border border-[#2A2A3A] bg-[#12121A] animate-pulse h-40 md:h-96 lg:h-[480px]" />
  }

  if (banners.length === 0) {
    return (
      <section className="w-full rounded-2xl border border-dashed border-[#2A2A3A] bg-[#12121A] flex flex-col items-center justify-center gap-6 h-48 sm:h-72 md:h-96 lg:h-[480px]">
        <p className="text-gray-600 text-sm">Nenhum banner configurado</p>
      </section>
    )
  }

  const banner = banners[currentIndex]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Banner container inclinado */}
      <div
        className="overflow-hidden w-full"
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
        </section>
      </div>

      {/* Botões por stream ao vivo */}
      {liveStreams.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {liveStreams.filter(s => {
            const storedSport = typeof window !== 'undefined' ? localStorage.getItem('futzone_sport') : null
            const pref = user?.content_preference ?? (storedSport as 'futebol' | 'basquete' | null) ?? 'luta'
            if (pref === 'luta') return true
            return !s.category || s.category === pref
          }).map(s => (
            <button
              key={s.id}
              onClick={() => router.push(`/jogo/${s.id}`)}
              className="relative font-extrabold text-white uppercase tracking-wide px-8 py-3 transition-all group"
              style={{ transform: 'skewX(-12deg)' }}
            >
              <span
                className="absolute inset-0 rounded-md group-hover:brightness-110 backdrop-blur-sm animate-orange-pulse-inner"
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                  boxShadow: '0 0 24px rgba(255,106,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
                aria-hidden
              />
              <span className="relative" style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
