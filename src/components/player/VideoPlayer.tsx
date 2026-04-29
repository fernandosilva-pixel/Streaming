'use client';

import { useState } from 'react';
import { Maximize2, Volume2, VolumeX, Settings, AlertCircle } from 'lucide-react';
import { Game, Server } from '@/types';
import { formatViewers } from '@/lib/utils';
import LiveBadge from '../common/LiveBadge';

interface VideoPlayerProps {
  game: Game;
  activeServer: Server;
}

export default function VideoPlayer({ game, activeServer }: VideoPlayerProps) {
  const [muted, setMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2A2A3A] bg-[#0B0B0F]">
      {/* Player area */}
      <div className="relative bg-black aspect-video flex items-center justify-center group">
        {/* Placeholder iframe visual */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0F] via-[#12121A] to-[#0B0B0F] flex items-center justify-center">
          {/* Stadium grid decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(#2A2A3A 1px, transparent 1px), linear-gradient(90deg, #2A2A3A 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          {/* Field circle */}
          <div className="relative flex flex-col items-center justify-center gap-6">
            <div className="w-40 h-40 rounded-full border-2 border-white/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-white/10" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="text-center">
                  <p className="text-4xl mb-1">{game.teamHome.logo}</p>
                  <p className="text-white font-bold text-sm">{game.teamHome.shortName}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-white font-black text-3xl tabular-nums">
                    {game.teamHome.score} - {game.teamAway.score}
                  </p>
                  <p className="text-orange-500 text-xs font-bold mt-1">{game.minute}'</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl mb-1">{game.teamAway.logo}</p>
                  <p className="text-white font-bold text-sm">{game.teamAway.shortName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <LiveBadge />
                <span className="text-gray-500 text-xs">{activeServer.name} · {activeServer.quality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player controls overlay (visible on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMuted(!muted)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              {game.viewers && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <span className="text-xs">{formatViewers(game.viewers)} espectadores</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Settings className="w-4 h-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <LiveBadge />
        </div>

        {/* Viewer count */}
        {game.viewers && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-white text-xs font-medium">{formatViewers(game.viewers)}</span>
          </div>
        )}
      </div>

      {/* Player bottom bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A3A] bg-[#12121A]">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-semibold text-sm">
              {game.teamHome.name} vs {game.teamAway.name}
            </p>
            <p className="text-gray-500 text-xs">{game.leagueLogo} {game.league}</p>
          </div>
        </div>
        <button
          onClick={() => setReportOpen(!reportOpen)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 text-xs transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Reportar problema
        </button>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="border-t border-[#2A2A3A] bg-[#12121A] p-4">
          <p className="text-white text-sm font-semibold mb-3">Qual o problema?</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {['Sem imagem', 'Sem áudio', 'Buffering', 'Link quebrado', 'Travando', 'Outro'].map(issue => (
              <button
                key={issue}
                onClick={() => setReportOpen(false)}
                className="text-xs text-gray-400 border border-[#2A2A3A] hover:border-orange-500/50 hover:text-white px-3 py-2 rounded-lg transition-all"
              >
                {issue}
              </button>
            ))}
          </div>
          <button onClick={() => setReportOpen(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
