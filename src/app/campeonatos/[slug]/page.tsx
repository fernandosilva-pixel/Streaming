import Link from 'next/link';
import { ChevronLeft, Trophy } from 'lucide-react';
import { getLeagueBySlug, getGamesByLeague } from '@/data/mock';
import GameCard from '@/components/common/GameCard';
import LiveBadge from '@/components/common/LiveBadge';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = await params;
  const league = getLeagueBySlug(slug);

  if (!league) notFound();

  const games = getGamesByLeague(slug);
  const liveGames = games.filter(g => g.status === 'live');
  const upcomingGames = games.filter(g => g.status === 'upcoming');
  const finishedGames = games.filter(g => g.status === 'finished');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/campeonatos" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" />
        Todos os campeonatos
      </Link>

      {/* League header */}
      <div className="rounded-2xl border border-[#2A2A3A] bg-gradient-to-br from-[#1A1A26] to-[#12121A] p-7 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/30 to-[#2A1A0A] flex items-center justify-center text-5xl">
            {league.logo}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-sm">{league.flag} {league.country}</span>
              {liveGames.length > 0 && <LiveBadge size="sm" />}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{league.name}</h1>
            <div className="flex items-center gap-5">
              <div>
                <p className="text-white font-bold">{games.length}</p>
                <p className="text-gray-600 text-xs">jogos hoje</p>
              </div>
              {liveGames.length > 0 && (
                <div>
                  <p className="text-orange-500 font-bold">{liveGames.length}</p>
                  <p className="text-gray-600 text-xs">ao vivo</p>
                </div>
              )}
              <div>
                <p className="text-white font-bold">{upcomingGames.length}</p>
                <p className="text-gray-600 text-xs">próximos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games */}
      <div className="space-y-7">
        {liveGames.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <LiveBadge />
              <span className="text-white font-bold">{liveGames.length} ao vivo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveGames.map(g => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {upcomingGames.length > 0 && (
          <section>
            <h2 className="text-white font-bold mb-4">Em breve</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingGames.map(g => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {finishedGames.length > 0 && (
          <section>
            <h2 className="text-gray-500 font-bold mb-4">Encerrados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70">
              {finishedGames.map(g => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {games.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Nenhum jogo hoje</p>
            <p className="text-gray-500 text-sm">Confira a agenda para outros dias</p>
          </div>
        )}
      </div>
    </div>
  );
}
