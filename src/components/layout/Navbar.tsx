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
        <div className="flex items-center">
          {user ? (
            <SkewButton onClick={logout} variant="outline">Sair</SkewButton>
          ) : (
            <>
              <SkewButton onClick={() => showModal('login')} variant="outline" z={1}>Entrar</SkewButton>
              <SkewButton onClick={() => showModal('register')} variant="solid" z={2} overlap>Criar conta</SkewButton>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

function SkewButton({
  onClick,
  variant,
  children,
  z = 1,
  overlap = false,
}: {
  onClick: () => void;
  variant: 'outline' | 'solid';
  children: React.ReactNode;
  z?: number;
  overlap?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide px-3 py-1.5 sm:px-5 sm:py-2.5 transition-all group"
      style={{ transform: 'skewX(-12deg)', zIndex: z, marginLeft: overlap ? -10 : undefined }}
    >
      <span
        className="absolute inset-0 rounded-md transition-all group-hover:brightness-110 backdrop-blur-sm"
        style={
          variant === 'solid'
            ? {
                background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                boxShadow: '0 0 18px rgba(255,106,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
              }
            : {
                background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 40%, rgba(0,0,0,0.08) 100%)',
                border: '1.5px solid rgba(255,106,0,0.5)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.12)',
              }
        }
        aria-hidden
      />
      <span className="relative" style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>
        {children}
      </span>
    </button>
  );
}
