'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isPlanActive } from '@/contexts/AuthContext';
import { useLanguage, Lang } from '@/contexts/LanguageContext';
import NotificationBell from '@/components/common/NotificationBell';

const langLabels: Record<Lang, { flag: string; label: string }> = {
  pt: { flag: '🇧🇷', label: 'PT' },
  en: { flag: '🇺🇸', label: 'EN' },
  es: { flag: '🇪🇸', label: 'ES' },
}

export default function Navbar() {
  const { user, showModal, logout } = useAuth();
  const planActive = isPlanActive(user);
  const { lang, setLang, t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
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

  useEffect(() => {
    if (!langOpen) return;
    const handler = () => setLangOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [langOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
      <div className="max-w-7xl mx-auto">
        <nav
          style={{
            height: 60,
            borderRadius: 14,
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

            {/* Language selector */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1 text-white/60 hover:text-white text-xs font-bold px-1 py-1 rounded-lg hover:bg-white/5 transition-all"
              >
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-lg shrink-0"
                  style={{ border: '1px solid rgba(227,6,19,0.35)', background: 'rgba(227,6,19,0.05)' }}
                >
                  {langLabels[lang].flag}
                </span>
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[110px]"
                  style={{
                    background: 'rgba(8,15,28,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {(Object.entries(langLabels) as [Lang, { flag: string; label: string }][]).map(([code, { flag, label }]) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setLangOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all"
                      style={{
                        color: lang === code ? '#E30613' : 'rgba(255,255,255,0.75)',
                        background: lang === code ? 'rgba(227,6,19,0.06)' : 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(227,6,19,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = lang === code ? 'rgba(227,6,19,0.06)' : 'transparent')}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
      className="text-xs sm:text-sm font-bold uppercase tracking-wide px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-150 hover:brightness-110 active:scale-95"
      style={base}
    >
      {children}
    </button>
  );
}
