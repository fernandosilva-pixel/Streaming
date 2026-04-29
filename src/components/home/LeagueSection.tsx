import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import { leagues } from '@/data/mock';

export default function LeagueSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Campeonatos</h2>
        </div>
        <Link
          href="/campeonatos"
          className="flex items-center gap-1.5 text-orange-500 text-sm font-medium hover:text-orange-400 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {leagues.map((league) => (
          <Link key={league.id} href={`/campeonatos/${league.slug}`}>
            <div className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-[#2A2A3A] bg-[#1A1A26] hover:border-orange-500/40 hover:bg-[#212132] transition-all duration-200 cursor-pointer text-center">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {league.logo}
              </span>
              <div>
                <p className="text-white text-xs font-semibold leading-tight line-clamp-2 group-hover:text-orange-400 transition-colors">
                  {league.name}
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5">{league.flag} {league.country}</p>
              </div>
              {league.gamesCount && league.gamesCount > 0 && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {league.gamesCount} jogos
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
