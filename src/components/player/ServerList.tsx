'use client';

import { Server as ServerIcon, Wifi } from 'lucide-react';
import { Server } from '@/types';
import { cn } from '@/lib/utils';

interface ServerListProps {
  servers: Server[];
  active: string;
  onSelect: (id: string) => void;
}

const qualityColor: Record<string, string> = {
  '1080p': 'text-green-400',
  '720p': 'text-blue-400',
  '480p': 'text-yellow-400',
};

export default function ServerList({ servers, active, onSelect }: ServerListProps) {
  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A26] p-4">
      <div className="flex items-center gap-2 mb-4">
        <ServerIcon className="w-4 h-4 text-orange-500" />
        <h3 className="text-white font-semibold text-sm">Servidores</h3>
        <span className="text-gray-600 text-xs ml-auto">{servers.length} disponíveis</span>
      </div>

      <div className="space-y-2">
        {servers.map((server, i) => {
          const isActive = server.id === active;
          const qualityKey = Object.keys(qualityColor).find(k => server.quality.includes(k));
          return (
            <button
              key={server.id}
              onClick={() => onSelect(server.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left',
                isActive
                  ? 'border-orange-500/60 bg-orange-500/10 shadow-[0_0_12px_rgba(255,106,0,0.15)]'
                  : 'border-[#2A2A3A] hover:border-orange-500/30 hover:bg-[#212132]'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                isActive ? 'bg-orange-500 text-white' : 'bg-[#2A2A3A] text-gray-400'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-gray-300')}>
                  {server.name}
                </p>
                <p className={cn('text-xs', qualityKey ? qualityColor[qualityKey] : 'text-gray-500')}>
                  {server.quality}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className={cn('w-3.5 h-3.5', isActive ? 'text-green-400' : 'text-gray-600')} />
                {isActive && <span className="text-green-400 text-[10px] font-bold">ATIVO</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
        <p className="text-orange-400 text-xs">
          💡 Se um servidor falhar, tente o próximo. Recomendamos o Servidor 1 para melhor qualidade.
        </p>
      </div>
    </div>
  );
}
