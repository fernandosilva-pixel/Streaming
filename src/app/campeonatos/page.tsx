import Link from 'next/link';
import { Trophy, ChevronRight } from 'lucide-react';
import { leagues, getGamesByLeague } from '@/data/mock';

export default function CampeonatosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Campeonatos</h1>
            <p className="text-gray-500 text-sm">{leagues.length} competições disponíveis</p>
          </div>
        </div>
      </div>

      {/* Leagues grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {leagues.map(league => {
          const games = getGamesByLeague(league.slug);
          const liveGames = games.filter(g => g.status === 'live');

          return (
            <Link key={league.id} href={`/campeonatos/${league.slug}`}>
              <div className="group h-full rounded-2xl border border-[#2A2A3A] bg-[#1A1A26] p-5 hover:border-orange-500/40 hover:bg-[#212132] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                {/* Logo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-[#2A1A0A] flex items-center justify-center text-3xl">
                    {league.logo}
                  </div>
                  {liveGames.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-600/10 border border-red-600/30 rounded-full px-2.5 py-1">
                      <span className="live-dot" style={{ width: 6, height: 6 }} />
                      <span className="text-red-500 text-[10px] font-bold">{liveGames.length} AO VIVO</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-white font-bold mb-1 group-hover:text-orange-400 transition-colors">
                  {league.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{league.flag} {league.country}</p>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-white font-bold text-sm">{games.length}</p>
                      <p className="text-gray-600 text-xs">jogos hoje</p>
                    </div>
                    {liveGames.length > 0 && (
                      <div>
                        <p className="text-orange-500 font-bold text-sm">{liveGames.length}</p>
                        <p className="text-gray-600 text-xs">ao vivo</p>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
