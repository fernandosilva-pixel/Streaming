'use client'

import { useEffect, useState, useCallback, ReactNode } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Noticia } from '@/lib/external-apis/news'

function formatarDataRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}

function Skeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '16px', minHeight: 280 }}
    >
      <div
        className="w-full h-full animate-pulse bg-gradient-to-br from-[#1A1A26] to-[#12121A]"
        style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%', minHeight: 280 }}
      />
    </div>
  )
}

interface NewsCarouselProps {
  fallback: ReactNode
}

export default function NewsCarousel({ fallback }: NewsCarouselProps) {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null)
  const [erro, setErro] = useState(false)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(({ noticias: data }: { noticias: Noticia[] }) => setNoticias(data))
      .catch(() => setErro(true))
  }, [])

  const avancar = useCallback(() => {
    setIndiceAtual(i => (noticias ? (i + 1) % noticias.length : 0))
  }, [noticias])

  const voltar = useCallback(() => {
    setIndiceAtual(i => (noticias ? (i - 1 + noticias.length) % noticias.length : 0))
  }, [noticias])

  const irPara = useCallback((i: number) => setIndiceAtual(i), [])

  useEffect(() => {
    if (pausado || !noticias?.length) return
    const id = setInterval(avancar, 6000)
    return () => clearInterval(id)
  }, [pausado, noticias, avancar])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') { voltar(); setPausado(true) }
    if (e.key === 'ArrowRight') { avancar(); setPausado(true) }
  }

  if (noticias === null && !erro) return <Skeleton />

  if (erro || (noticias !== null && noticias.length === 0)) {
    return <>{fallback}</>
  }

  const noticia = noticias![indiceAtual]
  const proxima = noticias![(indiceAtual + 1) % noticias!.length]

  return (
    <div
      className="overflow-hidden group"
      style={{ transform: 'skewX(-3deg)', border: '1px solid #2A2A3A', borderRadius: '16px', minHeight: 280 }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Notícias de futebol"
      tabIndex={0}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{ transform: 'skewX(3deg)', width: '107%', marginLeft: '-3.5%', minHeight: 280, position: 'relative' }}
      >
        {noticias!.map((n, i) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={i !== indiceAtual}
            tabIndex={i !== indiceAtual ? -1 : 0}
            className="absolute inset-0 block transition-opacity duration-500"
            style={{ opacity: i === indiceAtual ? 1 : 0, minHeight: 280, zIndex: i === indiceAtual ? 1 : 0 }}
          >
            <div className="relative w-full h-full" style={{ minHeight: 280 }}>
              {n.imagem && (
                <Image
                  src={n.imagem}
                  alt={n.titulo}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  unoptimized
                />
              )}
              {i === indiceAtual && proxima?.imagem && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proxima.imagem} alt="" aria-hidden className="hidden" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
                <div aria-live={i === indiceAtual ? 'polite' : undefined}>
                  <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{n.titulo}</h3>
                  <p className="text-gray-300 text-xs mt-1.5">{n.fonte} · {formatarDataRelativa(n.publicadoEm)}</p>
                </div>
              </div>
            </div>
          </a>
        ))}

        <div style={{ minHeight: 280 }} aria-hidden="true" />

        <button
          onClick={(e) => { e.preventDefault(); voltar(); setPausado(true) }}
          aria-label="Notícia anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/75"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); avancar(); setPausado(true) }}
          aria-label="Próxima notícia"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/75"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          {noticias!.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); irPara(i); setPausado(true) }}
              aria-label={`Ir para notícia ${i + 1}`}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
              style={{ background: i === indiceAtual ? '#fff' : 'rgba(255,255,255,0.4)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
