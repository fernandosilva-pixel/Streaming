import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import AuthModal from '@/components/auth/AuthModal'
import PresenceTracker from '@/components/analytics/PresenceTracker';
import ReferralTracker from '@/components/analytics/ReferralTracker';
import PopupBanner from '@/components/common/PopupBanner';
import ScheduleNotification from '@/components/common/ScheduleNotification';
import OnboardingModals from '@/components/common/OnboardingModals';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabaseAdmin.from('site_settings').select('favicon_url').maybeSingle()
  return {
    title: 'FutZone — Futebol Ao Vivo',
    description: 'Assista aos melhores jogos de futebol ao vivo. Champions League, Brasileirão, Premier League e mais.',
    keywords: ['futebol ao vivo', 'jogos online', 'transmissão futebol', 'assistir futebol'],
    icons: data?.favicon_url ? { icon: data.favicon_url } : undefined,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col text-white antialiased">
        {/* Background fixo */}
        <div className="fixed inset-0 -z-10" style={{ backgroundImage: "url('/bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
        <LanguageProvider>
          <AuthProvider>
            <ScheduleProvider>
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
              <AuthModal />
              <PresenceTracker />
              <ReferralTracker />
              <PopupBanner />
              <ScheduleNotification />
              <OnboardingModals />
            </ScheduleProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
