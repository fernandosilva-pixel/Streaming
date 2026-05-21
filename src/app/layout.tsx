import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import SiteShell from '@/components/layout/SiteShell';
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
              <SiteShell>{children}</SiteShell>
            </ScheduleProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
