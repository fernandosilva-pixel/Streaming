'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, showModal, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        style={{
          backgroundImage: 'url(/bg.jpg)',
          backgroundSize: '100% 100%',
          borderBottomLeftRadius: '1.75rem',
          borderBottomRightRadius: '1.75rem',
          borderBottom: '1px solid rgba(255,106,0,0.22)',
          borderLeft: '1px solid rgba(255,106,0,0.15)',
          borderRight: '1px solid rgba(255,106,0,0.15)',
          boxShadow: '0 6px 36px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center justify-end px-6 sm:px-10" style={{ height: 64 }}>
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
