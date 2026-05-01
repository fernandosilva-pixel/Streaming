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
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, #0D0D1A 0%, #0B0B14 100%)',
        borderBottom: '1px solid rgba(255, 106, 0, 0.15)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.6)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8" style={{ height: 64 }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="FutZone"
              className="block object-contain"
              style={{ height: 36, width: 'auto', maxWidth: 140 }}
            />
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)' }}
              >
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                FUT<span className="text-orange-500">ZONE</span>
              </span>
            </>
          )}
        </Link>

        {/* Botões */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <button
              onClick={logout}
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors px-4 py-2"
            >
              Sair
            </button>
          ) : (
            <>
              <button
                onClick={() => showModal('login')}
                className="text-sm font-semibold text-white transition-all px-4 sm:px-5 py-2 rounded-lg hover:bg-white/5"
              >
                Entrar
              </button>
              <button
                onClick={() => showModal('register')}
                className="text-sm font-bold text-white rounded-lg px-4 sm:px-5 py-2 transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C00 100%)',
                  boxShadow: '0 0 16px rgba(255,106,0,0.35)',
                }}
              >
                Criar conta
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
