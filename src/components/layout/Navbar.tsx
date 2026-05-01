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
    <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
      <div
        className="bg-[#0D0D18]/95 backdrop-blur-md rounded-full"
        style={{
          border: '1px solid rgba(255,106,0,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
      >
        {/* grid 3 colunas: espaço | logo | botões — garante logo centralizada sem sobrepor */}
        <div
          className="grid items-center px-4 sm:px-6"
          style={{ height: 58, gridTemplateColumns: '1fr auto 1fr' }}
        >
          {/* coluna esquerda vazia */}
          <div />

          {/* Logo centro */}
          <Link href="/" className="block">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="FutZone"
                className="block object-contain"
                style={{ height: 32, width: 'auto', maxWidth: 140 }}
              />
            ) : (
              <span className="text-lg font-black tracking-tight">
                FUT<span className="text-orange-500">ZONE</span>
              </span>
            )}
          </Link>

          {/* Botões direita */}
          <div className="flex items-center justify-end gap-2">
            {user ? (
              <button
                onClick={logout}
                className="text-xs sm:text-sm font-bold text-white border border-orange-500/60 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 hover:bg-orange-500/10 transition-all whitespace-nowrap"
              >
                Sair
              </button>
            ) : (
              <>
                <button
                  onClick={() => showModal('login')}
                  className="text-xs sm:text-sm font-bold text-white border border-orange-500/60 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 hover:bg-orange-500/10 transition-all whitespace-nowrap"
                >
                  Entrar
                </button>
                <button
                  onClick={() => showModal('register')}
                  className="text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 transition-all whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Criar conta</span>
                  <span className="sm:hidden">Cadastrar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
