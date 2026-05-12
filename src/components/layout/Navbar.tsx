'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Lang } from '@/contexts/LanguageContext';
import NotificationBell from '@/components/common/NotificationBell';

const langLabels: Record<Lang, { flag: string; label: string }> = {
  pt: { flag: '🇧🇷', label: 'PT' },
  en: { flag: '🇺🇸', label: 'EN' },
  es: { flag: '🇪🇸', label: 'ES' },
}

export default function Navbar() {
  const { user, showModal, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = () => setLangOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [langOpen]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(0,0,0,0.38)',
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
              style={{ height: 44, width: 'auto', maxWidth: 180 }}
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

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Bell */}
          <NotificationBell homeTeam="" awayTeam="" matchTime="" />

          {/* Language selector */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-bold px-1 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg text-lg shrink-0"
                style={{ border: '1.5px solid rgba(255,106,0,0.5)', background: 'transparent' }}
              >
                {langLabels[lang].flag}
              </span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#12121A] border border-[#2A2A3A] rounded-xl overflow-hidden shadow-2xl z-50 min-w-[110px]">
                {(Object.entries(langLabels) as [Lang, { flag: string; label: string }][]).map(([code, { flag, label }]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all hover:bg-orange-500/10 hover:text-orange-400 ${lang === code ? 'text-orange-400 bg-orange-500/5' : 'text-white'}`}
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
            <SkewButton onClick={logout} variant="outline">{t('logout')}</SkewButton>
          ) : (
            <>
              <SkewButton onClick={() => showModal('login')} variant="outline" z={1}>{t('signIn')}</SkewButton>
              <SkewButton onClick={() => showModal('register')} variant="solid" z={2} overlap>{t('signUp')}</SkewButton>
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
