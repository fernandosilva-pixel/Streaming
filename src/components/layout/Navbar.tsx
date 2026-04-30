'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, showModal, logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl bg-[#0B0B0F]/70 backdrop-blur-md border-x border-b border-orange-500/40 rounded-b-[2rem]"
      style={{ boxShadow: '0 0 18px rgba(249,115,22,0.18), 0 0 6px rgba(249,115,22,0.10) inset' }}
    >
      {/* Glow direito */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-white/[0.05] to-transparent rounded-br-[2rem]" />

      <nav className="relative px-6">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo centralizado */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-black tracking-tight">
                  FUT<span className="text-orange-500">ZONE</span>
                </span>
              </>
            )}
          </Link>

          {/* Placeholder esquerdo para balancear */}
          <div className="w-24" />

          {/* Ações direita */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-white border border-[#2A2A3A] hover:border-orange-500/50 px-4 py-1.5 rounded-xl transition-all"
              >
                Sair
              </button>
            ) : (
              <button
                onClick={showModal}
                className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 px-4 py-1.5 rounded-xl transition-all"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
