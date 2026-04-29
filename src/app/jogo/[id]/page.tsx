'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, Flame, TrendingUp } from 'lucide-react';
import { getGameById, liveGames, allGames, formatViewers } from '@/data/mock';
import VideoPlayer from '@/components/player/VideoPlayer';
import ServerList from '@/components/player/ServerList';
import ChatPanel from '@/components/player/ChatPanel';
import GameCard from '@/components/common/GameCard';
import LiveBadge from '@/components/common/LiveBadge';
import { useAuth } from '@/contexts/AuthContext';
import { use } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function JogoPage({ params }: Props) {
  const { id } = use(params);
  const game = getGameById(id);
  const { user, showModal } = useAuth();

  const defaultServer = game?.servers?.[0]?.id ?? '';
  const [activeServer, setActiveServer] = useState(defaultServer);

  useEffect(() => {
    if (!user) showModal()
  }, [user]);

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-white mb-2">Jogo não encontrado</h1>
        <p className="text-gray-500 mb-6">Este jogo não está disponível ou foi encerrado.</p>
        <Link href="/" className="btn-primary inline-flex">Voltar ao início</Link>
      </div>
    );
  }

  const currentServer = game.servers?.find(s => s.id === activeServer) ?? game.servers?.[0];
  const relatedGames = allGames.filter(g => g.id !== game.id && (g.league === game.league || g.status === 'live')).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Início
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400 text-sm">{game.leagueLogo} {game.league}</span>
        <span className="text-gray-700">/</span>
        <span className="text-white text-sm font-medium">
          {game.teamHome.shortName} vs {game.teamAway.shortName}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — player + servers */}
        <div className="xl:col-span-2 space-y-4">
          {currentServer && <VideoPlayer game={game} activeServer={currentServer} />}

          {/* Game info card */}
          <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A26] p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {game.status === 'live' && <LiveBadge />}
                  <span className="text-gray-500 text-sm">{game.leagueLogo} {game.league}</span>
                </div>
                <h1 className="text-white font-black text-xl">
                  {game.teamHome.name} <span className="text-gray-600">vs</span> {game.teamAway.name}
                </h1>
                {game.status === 'live' && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-orange-500 font-bold text-sm">{game.minute}' min</span>
                    <span className="text-white font-bold text-lg tabular-nums">
                      {game.teamHome.score} - {game.teamAway.score}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {game.viewers && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Eye className="w-4 h-4" />
                    <div>
                      <p className="text-white font-bold text-sm">{formatViewers(game.viewers)}</p>
                      <p className="text-gray-600 text-xs">espectadores</p>
                    </div>
                  </div>
                )}
                {game.isPopular && (
                  <div className="flex items-center gap-1.5 text-orange-500">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    <div>
                      <p className="font-bold text-sm">Em Alta</p>
                      <p className="text-orange-400/70 text-xs">Top #1</p>
                    </div>
                  </div>
                )}
                <Link
                  href="#"
                  className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Apostar neste jogo
                </Link>
              </div>
            </div>
          </div>

          {/* Servers */}
          {game.servers && game.servers.length > 0 && (
            <ServerList
              servers={game.servers}
              active={activeServer}
              onSelect={setActiveServer}
            />
          )}

          {/* Related games */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="text-white font-bold">Outros Jogos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGames.map(g => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — chat */}
        <div className="xl:col-span-1">
          <div className="sticky top-20">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
