'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isPlanActive } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBell from '@/components/common/NotificationBell';

export default function Navbar() {
  const { user, showModal, logout } = useAuth();
  const planActive = isPlanActive(user);
  const { t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
      <div className="max-w-7xl mx-auto">
        <nav
          style={{
            height: 60,
            borderRadius: 9999,
            background: scrolled
              ? 'rgba(8, 15, 28, 0.82)'
              : 'rgba(8, 15, 28, 0.55)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: scrolled
              ? '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}
          className="flex items-center justify-between px-5"
        >
          {/* Linha vermelha inferior sutil */}
          <div
            className="absolute bottom-0 left-6 right-6 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(227,6,19,0.25) 40%, rgba(227,6,19,0.25) 60%, transparent)' }}
          />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="FutZone"
                className="block object-contain"
                style={{ height: 40, width: 'auto', maxWidth: 180 }}
              />
            ) : (
              <>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E30613, #A0000E)',
                    boxShadow: '0 0 12px rgba(227,6,19,0.4)',
                  }}
                >
                  <Zap className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  FUT<span style={{ color: '#E30613' }}>ZONE</span>
                </span>
              </>
            )}
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1.5">

            {/* Bell */}
            <NotificationBell homeTeam="" awayTeam="" matchTime="" />

            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/perfil" className="relative flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <div
                    className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #E30613, #A0000E)',
                      border: '2px solid rgba(227,6,19,0.6)',
                    }}
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {planActive && (
                    <span
                      className="text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: '#E30613' }}
                    >
                      PRO
                    </span>
                  )}
                </Link>
                <GlassButton onClick={logout} variant="outline">{t('logout')}</GlassButton>
              </div>
            ) : (
              <>
                <GlassButton onClick={() => showModal('login')} variant="outline">{t('signIn')}</GlassButton>
                <GlassButton onClick={() => showModal('register')} variant="solid">{t('signUp')}</GlassButton>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function GlassButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: 'outline' | 'solid';
  children: React.ReactNode;
}) {
  const base: React.CSSProperties =
    variant === 'solid'
      ? {
          background: 'linear-gradient(135deg, #E30613 0%, #A0000E 100%)',
          boxShadow: '0 0 16px rgba(227,6,19,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          border: '1px solid rgba(227,6,19,0.4)',
          color: '#fff',
        }
      : {
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.8)',
        };

  return (
    <button
      onClick={onClick}
      className="text-xs sm:text-sm font-bold uppercase tracking-wide px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-150 hover:brightness-110 active:scale-95"
      style={base}
    >
      {children}
    </button>
  );
}
