'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, X, Share2, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, [])

  return (
    <footer className="border-t border-[#2A2A3A] mt-20" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="FutZone"
                  style={{ height: 44, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="text-xl font-black">FUT<span className="text-orange-500">ZONE</span></span>
                </>
              )}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Sua plataforma de futebol ao vivo. Assista aos melhores jogos dos principais campeonatos do mundo.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[X, Share2, PlayCircle].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-lg bg-[#1A1A26] border border-[#2A2A3A] flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/50 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Navegação</h3>
            <ul className="space-y-2.5">
              {['Início', 'Agenda', 'Campeonatos', 'Notícias', 'Ao Vivo'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Suporte</h3>
            <ul className="space-y-2.5">
              {['Central de Ajuda', 'Reportar Problema', 'Política de Privacidade', 'Termos de Uso', 'Contato'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A2A3A] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © 2026 FutZone. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-gray-500 text-xs">Transmissões em tempo real</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
