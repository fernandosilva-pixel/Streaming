'use client';

import { useState, useMemo } from 'react';
import { Calendar, Filter, Clock } from 'lucide-react';
import { allGames, leagues } from '@/data/mock';
import GameCard from '@/components/common/GameCard';
import LiveBadge from '@/components/common/LiveBadge';
import { GameStatus } from '@/types';

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'live', label: '🔴 Ao Vivo' },
  { value: 'upcoming', label: '⏰ Em Breve' },
  { value: 'finished', label: '✓ Encerrado' },
];

export default function AgendaPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');

  const liveCount = allGames.filter(g => g.status === 'live').length;

  const filtered = useMemo(() => {
    return allGames.filter(g => {
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchLeague = leagueFilter === 'all' || g.leagueSlug === leagueFilter;
      return matchStatus && matchLeague;
    });
  }, [statusFilter, leagueFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof allGames> = {
      live: filtered.filter(g => g.status === 'live'),
      upcoming: filtered.filter(g => g.status === 'upcoming'),
      finished: filtered.filter(g => g.status === 'finished'),
    };
    return groups;
  }, [filtered]);

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Agenda de Jogos</h1>
            <p className="text-gray-500 text-sm capitalize">{today}</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'Ao Vivo', count: liveCount, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Hoje', count: allGames.filter(g => g.status === 'upcoming').length, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Encerrados', count: allGames.filter(g => g.status === 'finished').length, color: 'text-gray-500', bg: 'bg-[#1A1A26] border-[#2A2A3A]' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border ${stat.bg} p-4 text-center`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7 p-4 rounded-xl border border-[#2A2A3A] bg-[#1A1A26]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-gray-500 text-sm">Filtros:</span>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#12121A] border border-[#2A2A3A] text-gray-400 hover:text-white hover:border-orange-500/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px bg-[#2A2A3A] hidden sm:block" />

        {/* League filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setLeagueFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              leagueFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-[#12121A] border border-[#2A2A3A] text-gray-400 hover:text-white hover:border-orange-500/30'
            }`}
          >
            Todos campeonatos
          </button>
          {leagues.slice(0, 4).map(l => (
            <button
              key={l.id}
              onClick={() => setLeagueFilter(l.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                leagueFilter === l.slug
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#12121A] border border-[#2A2A3A] text-gray-400 hover:text-white hover:border-orange-500/30'
              }`}
            >
              {l.logo} {l.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Game sections */}
      <div className="space-y-8">
        {grouped.live.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <LiveBadge />
              <span className="text-white font-bold">{grouped.live.length} jogos ao vivo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped.live.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          </section>
        )}

        {grouped.upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-[#1A1A26] border border-[#2A2A3A] rounded px-2 py-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-white font-bold text-xs uppercase tracking-wider">Em breve</span>
              </div>
              <span className="text-gray-500 text-sm">{grouped.upcoming.length} jogos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped.upcoming.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          </section>
        )}

        {grouped.finished.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-600 font-bold text-xs uppercase tracking-wider bg-[#1A1A26] border border-[#2A2A3A] px-2 py-1 rounded">
                Encerrados
              </span>
              <span className="text-gray-500 text-sm">{grouped.finished.length} jogos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70">
              {grouped.finished.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏟️</p>
            <p className="text-white font-bold mb-1">Nenhum jogo encontrado</p>
            <p className="text-gray-500 text-sm">Tente mudar os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
