import HeroBanner from '@/components/home/HeroBanner';
import UpcomingGames from '@/components/home/UpcomingGames';
import LeagueSection from '@/components/home/LeagueSection';
import NewsSection from '@/components/home/NewsSection';

// Banner ad placeholder
function AdBanner() {
  return (
    <div className="w-full h-16 rounded-xl border border-[#2A2A3A] bg-[#1A1A26] flex items-center justify-center overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">Publicidade</span>
        <div className="w-px h-4 bg-[#2A2A3A]" />
        <span className="text-orange-500 text-sm font-bold cursor-pointer hover:text-orange-400 transition-colors">
          👉 Aposte nos jogos de hoje — odds incríveis
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <HeroBanner />
      <AdBanner />
      <UpcomingGames />
      <LeagueSection />
      <NewsSection />
    </div>
  );
}
