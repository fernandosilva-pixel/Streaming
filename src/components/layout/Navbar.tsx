'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Search, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, showModal, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('site_settings').select('logo_url').single().then(({ data }) => {
      if (data?.logo_url) setLogoUrl(data.logo_url)
    })
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0B0F]/95 backdrop-blur-md border-b border-[#2A2A3A]'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/40 transition-shadow">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-black tracking-tight">
                  FUT<span className="text-orange-500">ZONE</span>
                </span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            {user ? (
              <button onClick={logout} className="btn-primary text-sm py-2 px-4">
                Sair
              </button>
            ) : (
              <button onClick={showModal} className="btn-primary text-sm py-2 px-4">
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
