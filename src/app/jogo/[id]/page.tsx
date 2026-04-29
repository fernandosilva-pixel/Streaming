'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { use } from 'react'
import ChatBox from '@/components/player/ChatBox'

interface Props {
  params: Promise<{ id: string }>
}

type Stream = {
  id: string
  title: string
  kick_channel: string
  crop_enabled: boolean
}

export default function JogoPage({ params }: Props) {
  const { id } = use(params)
  const { user, showModal } = useAuth()
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) showModal()
  }, [user])

  useEffect(() => {
    supabase.from('streams').select('*').eq('id', id).single().then(({ data }) => {
      setStream(data)
      setLoading(false)
    })
  }, [id])

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

  const cropStyle: React.CSSProperties = stream.crop_enabled ? {
    position: 'absolute',
    top: -52,
    left: 0,
    width: '100%',
    height: 'calc(100% + 104px)',
    border: 'none',
  } : {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  }

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
          <div
            className="rounded-xl border border-[#2A2A3A] bg-black w-full relative"
            style={{ aspectRatio: '16/9', overflow: 'hidden' }}
          >
            {user ? (
              <iframe
                src={`https://player.kick.com/${stream.kick_channel}?autoplay=true`}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                style={cropStyle}
              />
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer bg-[#0B0B0F]"
                onClick={showModal}
              >
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Conteúdo restrito</p>
                  <p className="text-gray-500 text-sm mt-1">Entre para assistir ao vivo</p>
                </div>
                <button className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all">
                  Entrar / Criar conta
                </button>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-white font-black text-xl">{stream.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">AO VIVO</span>
              <span className="text-gray-500 text-sm">kick.com/{stream.kick_channel}</span>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="xl:col-span-1">
          <div className="sticky top-20 rounded-xl overflow-hidden border border-[#2A2A3A] bg-[#0B0B0F]" style={{ height: 560 }}>
            <ChatBox streamId={stream.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
