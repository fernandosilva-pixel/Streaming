import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { upcomingGames } from '@/data/mock';
import GameCard from '../common/GameCard';

export default function UpcomingGames() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Próximos Jogos</h2>
            <p className="text-gray-600 text-xs">Hoje</p>
          </div>
        </div>
        <Link
          href="/agenda"
          className="flex items-center gap-1.5 text-orange-500 text-sm font-medium hover:text-orange-400 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcomingGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
