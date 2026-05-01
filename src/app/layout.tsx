import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal'
import PresenceTracker from '@/components/analytics/PresenceTracker';
import PopupBanner from '@/components/common/PopupBanner';

export const metadata: Metadata = {
  title: 'FutZone — Futebol Ao Vivo',
  description: 'Assista aos melhores jogos de futebol ao vivo. Champions League, Brasileirão, Premier League e mais.',
  keywords: ['futebol ao vivo', 'jogos online', 'transmissão futebol', 'assistir futebol'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col text-white antialiased">
        {/* Background fixo */}
        <div className="fixed inset-0 -z-10 bg-[#0B0B0F]" />
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <AuthModal />
          <PresenceTracker />
          <PopupBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
