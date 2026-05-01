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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Main bar */}
      <div
        style={{
          backgroundImage: 'url(/bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottomLeftRadius: '1.75rem',
          borderBottomRightRadius: '1.75rem',
          borderBottom: '1px solid rgba(255,106,0,0.22)',
          borderLeft: '1px solid rgba(255,106,0,0.15)',
          borderRight: '1px solid rgba(255,106,0,0.15)',
          boxShadow: '0 6px 36px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center px-6 sm:px-10 gap-6" style={{ height: 64 }}>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="FutZone"
                width={160}
                height={40}
                className="block object-contain"
                style={{
                  height: 'clamp(36px, 6vw, 56px)',
                  width: 'auto',
                  maxWidth: 220,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px rgba(255,106,0,0.45))',
                }}
              />
            ) : (
              <span className="flex items-center gap-2">
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-black tracking-tight">
                  FUT<span className="text-orange-500">ZONE</span>
                </span>
              </span>
            )}
          </Link>

          <div className="flex-1" />

          {/* Botões */}
          <div className="flex items-center">
            {user ? (
              <SkewButton onClick={logout} variant="outline">Sair</SkewButton>
            ) : (
              <div className="flex items-center">
                <SkewButton onClick={() => showModal('login')} variant="outline" z={1}>Entrar</SkewButton>
                <SkewButton onClick={() => showModal('register')} variant="solid" z={2} overlap>Criar conta</SkewButton>
              </div>
            )}
          </div>

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
      style={{
        transform: 'skewX(-12deg)',
        zIndex: z,
        marginLeft: overlap ? -10 : undefined,
      }}
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
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,106,0,0.65)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }
        }
        aria-hidden
      />
      <span
        className="relative"
        style={{ display: 'inline-block', transform: 'skewX(12deg)' }}
      >
        {children}
      </span>
    </button>
  );
}
