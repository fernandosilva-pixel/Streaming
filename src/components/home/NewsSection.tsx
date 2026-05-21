'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NewsCarousel from '@/components/home/NewsCarousel'

type CtaCard = {
  id: string
  slot: number
  image_url: string | null
  mobile_image_url: string | null
  link_url: string | null
}

function CtaWrapper({ card, children, className, style }: { card: CtaCard | undefined; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  if (card?.link_url) {
    return <a href={card.link_url} target="_blank" rel="noopener noreferrer" className={className} style={style}>{children}</a>
  }
  return <div className={className} style={style}>{children}</div>
}

export default function NewsSection() {
  const [cards, setCards] = useState<CtaCard[]>([])

  useEffect(() => {
    supabase.from('cta_cards').select('*').order('slot').then(({ data }) => {
      setCards(data ?? [])
    })
  }, [])

  const featured = cards.find(c => c.slot === 0)
  const smalls = [1, 2, 3, 4].map(s => cards.find(c => c.slot === s))

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Card principal (coluna esquerda, maior) — carousel de notícias com fallback para o banner */}
        <div className="lg:col-span-1">
          <NewsCarousel fallback={
            <div
              className="overflow-hidden"
              style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '16px', minHeight: 280 }}
            >
              <CtaWrapper
                card={featured}
                className="block h-full"
                style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%' } as React.CSSProperties}
              >
                {featured?.image_url ? (
                  <picture className="block w-full h-full">
                    {featured.mobile_image_url && <source media="(max-width: 767px)" srcSet={featured.mobile_image_url} />}
                    <img src={featured.image_url} alt="" className="w-full h-full object-cover" style={{ minHeight: 280 }} />
                  </picture>
                ) : (
                  <div className="h-full min-h-[280px] bg-gradient-to-br from-orange-500/10 via-[#1A1A26] to-[#12121A] flex items-center justify-center">
                    <p className="text-gray-700 font-bold tracking-widest text-sm">EM BREVE</p>
                  </div>
                )}
              </CtaWrapper>
            </div>
          } />
        </div>

        {/* 4 cards horizontais */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {smalls.map((card, i) => (
            <div
              key={i}
              className="overflow-hidden"
              style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '12px' }}
            >
              <CtaWrapper
                card={card}
                className="block"
                style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%' } as React.CSSProperties}
              >
                {card?.image_url ? (
                  <picture className="block w-full">
                    {card.mobile_image_url && <source media="(max-width: 767px)" srcSet={card.mobile_image_url} />}
                    <img src={card.image_url} alt="" className="w-full object-cover" style={{ height: 120 }} />
                  </picture>
                ) : (
                  <div className="flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-[#1A1A26] to-[#12121A]" style={{ height: 120 }}>
                    <p className="text-gray-700 font-bold tracking-widest text-xs">EM BREVE</p>
                  </div>
                )}
              </CtaWrapper>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
