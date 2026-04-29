import Link from 'next/link';
import { Eye, Flame, Clock } from 'lucide-react';
import { Game } from '@/types';
import { formatViewers } from '@/lib/utils';
import LiveBadge from './LiveBadge';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export default function GameCard({ game, variant = 'default', className }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinished = game.status === 'finished';

  if (variant === 'compact') {
    return (
      <Link href={`/jogo/${game.id}`}>
        <div
          className={cn(
            'group flex items-center gap-3 p-3 rounded-xl border border-[#2A2A3A] bg-[#1A1A26]',
            'hover:border-orange-500/40 hover:bg-[#212132] transition-all duration-200 cursor-pointer',
            className
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-gray-500 font-medium">{game.leagueLogo} {game.league}</span>
              {isLive && <LiveBadge size="sm" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 truncate">{game.teamHome.name}</span>
              {isLive || isFinished ? (
                <span className="text-sm font-bold text-white shrink-0">
                  {game.teamHome.score} - {game.teamAway.score}
                </span>
              ) : (
                <span className="text-xs text-gray-600 shrink-0">vs</span>
              )}
              <span className="text-sm text-gray-300 truncate">{game.teamAway.name}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {isLive ? (
              <span className="text-orange-500 text-xs font-bold">{game.minute}'</span>
            ) : (
              <span className="text-gray-500 text-xs">{game.time}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/jogo/${game.id}`}>
        <div
          className={cn(
            'group relative overflow-hidden rounded-2xl border cursor-pointer',
            'bg-gradient-to-br from-[#1A1A26] to-[#12121A]',
            isLive ? 'border-orange-500/40 shadow-[0_0_30px_rgba(255,106,0,0.15)]' : 'border-[#2A2A3A]',
            'hover:border-orange-500/60 hover:shadow-[0_0_40px_rgba(255,106,0,0.25)] transition-all duration-300',
            className
          )}
        >
          {/* Top glow for live */}
          {isLive && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs text-gray-500 font-medium">{game.leagueLogo} {game.league}</span>
              {isLive ? (
                <LiveBadge />
              ) : isFinished ? (
                <span className="text-xs text-gray-600 font-medium bg-[#2A2A3A] px-2 py-1 rounded">Encerrado</span>
              ) : (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{game.time}</span>
                </div>
              )}
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="text-4xl mb-2">{game.teamHome.logo}</div>
                <p className="text-white font-bold text-sm">{game.teamHome.shortName}</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{game.teamHome.name}</p>
              </div>

              <div className="flex-shrink-0 text-center">
                {isLive || isFinished ? (
                  <div>
                    <p className="text-3xl font-black text-white tabular-nums">
                      {game.teamHome.score} <span className="text-gray-600">-</span> {game.teamAway.score}
                    </p>
                    {isLive && (
                      <p className="text-orange-500 text-xs font-bold mt-1">{game.minute}'</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 text-lg font-bold">VS</p>
                    <p className="text-orange-500 text-xs font-bold mt-1">{game.time}</p>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center">
                <div className="text-4xl mb-2">{game.teamAway.logo}</div>
                <p className="text-white font-bold text-sm">{game.teamAway.shortName}</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{game.teamAway.name}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#2A2A3A]">
              <div className="flex items-center gap-3">
                {game.viewers && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-xs">{formatViewers(game.viewers)}</span>
                  </div>
                )}
                {game.isPopular && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    <span className="text-xs font-medium">Em alta</span>
                  </div>
                )}
              </div>

              {isLive && (
                <span className="text-xs text-orange-500 font-semibold group-hover:text-orange-400 transition-colors">
                  Assistir agora →
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link href={`/jogo/${game.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border cursor-pointer',
          'bg-[#1A1A26] transition-all duration-200',
          isLive
            ? 'border-orange-500/30 hover:border-orange-500/60 hover:shadow-[0_4px_20px_rgba(255,106,0,0.2)]'
            : 'border-[#2A2A3A] hover:border-[#3A3A4A] hover:shadow-card',
          'hover:-translate-y-0.5',
          className
        )}
      >
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-gray-600 font-medium">{game.leagueLogo} {game.league}</span>
            {isLive ? (
              <LiveBadge size="sm" />
            ) : isFinished ? (
              <span className="text-[10px] text-gray-600 font-medium">Encerrado</span>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">{game.time}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xl">{game.teamHome.logo}</span>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{game.teamHome.name}</p>
              </div>
            </div>

            <div className="text-center shrink-0 px-1">
              {isLive || isFinished ? (
                <p className="text-white font-black text-lg tabular-nums">
                  {game.teamHome.score} <span className="text-gray-600 text-base">-</span> {game.teamAway.score}
                </p>
              ) : (
                <p className="text-orange-500 font-bold text-sm">{game.time}</p>
              )}
              {isLive && (
                <p className="text-orange-500 text-[10px] font-bold">{game.minute}'</p>
              )}
            </div>

            <div className="flex-1 flex items-center justify-end gap-2">
              <div className="min-w-0 text-right">
                <p className="text-white text-sm font-semibold truncate">{game.teamAway.name}</p>
              </div>
              <span className="text-xl">{game.teamAway.logo}</span>
            </div>
          </div>

          {(game.viewers || game.isPopular) && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#2A2A3A]">
              {game.viewers && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Eye className="w-3 h-3" />
                  <span className="text-[11px]">{formatViewers(game.viewers)}</span>
                </div>
              )}
              {game.isPopular && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-3 h-3 fill-orange-500" />
                  <span className="text-[11px] font-medium">Em alta</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
