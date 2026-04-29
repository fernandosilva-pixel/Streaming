'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Eye, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { liveGames } from '@/data/mock';
import { formatViewers } from '@/lib/utils';
import LiveBadge from '../common/LiveBadge';

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const featured = liveGames.filter(g => g.isPopular);
  const game = featured[current] ?? liveGames[0];

  const prev = () => setCurrent(c => (c - 1 + featured.length) % featured.length);
  const next = () => setCurrent(c => (c + 1) % featured.length);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2A2A3A] bg-gradient-to-br from-[#1A0800] via-[#12121A] to-[#0B0B0F]">
      {/* Orange top line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl" />
        {/* Stadium lines decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" style={{ right: '33%' }} />
      </div>

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left — match info */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-6">
              <LiveBadge />
              <span className="text-gray-500 text-sm">{game.leagueLogo} {game.league}</span>
              {game.isPopular && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4 fill-orange-500" />
                  <span className="text-xs font-bold">MAIS ASSISTIDO</span>
                </div>
              )}
            </div>

            {/* Teams */}
            <div className="flex items-center gap-4 sm:gap-6 mb-8">
              <div className="flex-1">
                <div className="text-5xl sm:text-6xl mb-3">{game.teamHome.logo}</div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{game.teamHome.name}</h2>
                <p className="text-gray-600 text-sm">{game.teamHome.shortName}</p>
              </div>

              <div className="text-center">
                <div className="bg-[#2A2A3A] rounded-2xl px-6 py-4">
                  <p className="text-4xl sm:text-5xl font-black text-white tabular-nums">
                    {game.teamHome.score} <span className="text-gray-600">-</span> {game.teamAway.score}
                  </p>
                  <p className="text-orange-500 text-sm font-bold mt-1">{game.minute}' min</p>
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-5xl sm:text-6xl mb-3 text-right">{game.teamAway.logo}</div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{game.teamAway.name}</h2>
                <p className="text-gray-600 text-sm">{game.teamAway.shortName}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8">
              {game.viewers && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-white font-bold text-sm">{formatViewers(game.viewers)}</p>
                    <p className="text-gray-600 text-xs">espectadores</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm">{game.servers?.length ?? 3} servidores</p>
                <p className="text-gray-600 text-xs">disponíveis</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href={`/jogo/${game.id}`}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,106,0,0.4)] active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Assistir Agora
              </Link>
              <button className="inline-flex items-center gap-2 border border-[#3A3A4A] hover:border-orange-500/50 text-gray-400 hover:text-white font-medium px-5 py-3 rounded-xl transition-all duration-200">
                Apostar neste jogo
              </button>
            </div>
          </div>

          {/* Right — mini playlist */}
          <div className="hidden lg:block w-64 xl:w-72">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Também ao vivo</p>
            <div className="space-y-2">
              {liveGames.filter(g => g.id !== game.id).map(g => (
                <Link key={g.id} href={`/jogo/${g.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#12121A] hover:bg-[#1A1A26] border border-transparent hover:border-orange-500/30 transition-all group cursor-pointer">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{g.teamHome.logo}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">
                          {g.teamHome.shortName} vs {g.teamAway.shortName}
                        </p>
                        <p className="text-gray-600 text-[10px] truncate">{g.league}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-xs tabular-nums">{g.teamHome.score} - {g.teamAway.score}</p>
                      <p className="text-orange-500 text-[10px] font-bold">{g.minute}'</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        {featured.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={prev} className="w-7 h-7 rounded-full bg-[#2A2A3A] hover:bg-orange-500/30 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-orange-500' : 'w-1.5 bg-[#2A2A3A]'}`}
              />
            ))}
            <button onClick={next} className="w-7 h-7 rounded-full bg-[#2A2A3A] hover:bg-orange-500/30 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
