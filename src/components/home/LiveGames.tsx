import { Radio } from 'lucide-react';
import { liveGames } from '@/data/mock';
import GameCard from '../common/GameCard';

export default function LiveGames() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ao Vivo Agora</h2>
            <p className="text-gray-600 text-xs">{liveGames.length} transmissões ativas</p>
          </div>
        </div>
        <span className="live-dot" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {liveGames.map((game, i) => (
          <div
            key={game.id}
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <GameCard game={game} variant="featured" />
          </div>
        ))}
      </div>
    </section>
  );
}
