'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type CarouselBanner = {
  id: string
  image_url: string
  mobile_image_url: string | null
  display_order: number
}

export default function GameCarousel() {
  const [banners, setBanners] = useState<CarouselBanner[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase
      .from('carousel_banners')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setBanners(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length)
    }, 4500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length])

  function goTo(index: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrent(index)
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent(c => (c + 1) % banners.length)
      }, 4500)
    }
  }

  if (loading) {
    return <div className="w-full rounded-xl bg-[#12121A] animate-pulse" style={{ height: 80 }} />
  }

  if (banners.length === 0) return null

  return (
    <div
      className="overflow-hidden w-full"
      style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '12px', height: 80 }}
    >
      <div
        className="relative w-full h-full"
        style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%' }}
      >
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <picture className="block w-full h-full">
              {b.mobile_image_url && (
                <source media="(max-width: 767px)" srcSet={b.mobile_image_url} />
              )}
              <img src={b.image_url} alt="Jogo em destaque" className="w-full h-full object-cover" />
            </picture>
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => goTo((current - 1 + banners.length) % banners.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-all z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goTo((current + 1) % banners.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-all z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all ${i === current ? 'bg-orange-500 w-5 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
