'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl px-0">
      <div
        className="bg-[#0D0D18]/95 backdrop-blur-md rounded-2xl"
        style={{
          border: '1px solid rgba(255,106,0,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
      >
        <div className="relative flex items-center px-5 sm:px-8" style={{ height: 58 }}>

          {/* Logo centralizada */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="block">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="FutZone"
                  className="block object-contain"
                  style={{ height: 34, width: 'auto', maxWidth: 150 }}
                />
              ) : (
                <span className="text-xl font-black tracking-tight">
                  FUT<span className="text-orange-500">ZONE</span>
                </span>
              )}
            </Link>
          </div>

          {/* Botões direita */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <button
                onClick={logout}
                className="text-sm font-bold text-white border border-orange-500/60 rounded-full px-5 py-2 hover:bg-orange-500/10 transition-all"
              >
                Sair
              </button>
            ) : (
              <>
                <button
                  onClick={() => showModal('login')}
                  className="text-sm font-bold text-white border border-orange-500/60 rounded-full px-5 py-2 hover:bg-orange-500/10 transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={() => showModal('register')}
                  className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 rounded-full px-5 py-2 transition-all"
                >
                  Criar conta
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
