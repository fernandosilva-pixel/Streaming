'use client'

import { X, CalendarDays } from 'lucide-react'
import { useSchedule } from '@/contexts/ScheduleContext'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Hoje · ${time}`
  if (d.toDateString() === tomorrow.toDateString()) return `Amanhã · ${time}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ` · ${time}`
}

export default function ScheduleNotification() {
  const { scheduleData, isOpen, closeSchedule, hasGames } = useSchedule()

  if (!isOpen || !hasGames || !scheduleData) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/65"
        style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        onClick={closeSchedule}
      />
      <div
        className="relative overflow-hidden w-full"
        style={{
          maxWidth: 460,
          transform: 'skewX(-2deg)',
          border: '1px solid rgba(255,106,0,0.3)',
          borderRadius: '22px',
          background: 'rgba(13,13,20,0.97)',
          backdropFilter: 'blur(56px) saturate(180%)',
          WebkitBackdropFilter: 'blur(56px) saturate(180%)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ transform: 'skewX(2deg)', width: '105%', marginLeft: '-2.5%' }}>
          <div
            className="flex items-center justify-between px-6 pt-6 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.28)' }}
              >
                <CalendarDays className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.15em]">Agenda</p>
                <p className="text-white font-bold text-base leading-tight">
                  {scheduleData.title || 'Próximos Jogos'}
                </p>
              </div>
            </div>
            <button
              onClick={closeSchedule}
              className="text-white/25 hover:text-white/70 transition-colors ml-4"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3 space-y-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {scheduleData.games.map(game => (
              <div
                key={game.id}
                className="flex flex-col gap-2 rounded-xl px-4 py-3 w-full"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center w-full gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {game.logo1 ? (
                      <img src={game.logo1} alt={game.team1} className="w-9 h-9 object-contain shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{game.team1.slice(0,3).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-gray-500 text-sm font-black">×</span>
                    {game.logo2 ? (
                      <img src={game.logo2} alt={game.team2} className="w-9 h-9 object-contain shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{game.team2.slice(0,3).toUpperCase()}</span>
                      </div>
                    )}
                    {game.league && (
                      <span className="text-gray-400 text-xs font-medium truncate">{game.league}</span>
                    )}
                  </div>
                  <span className="text-orange-400 text-sm font-bold whitespace-nowrap shrink-0">
                    {formatDateTime(game.datetime)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pt-2 pb-6 flex justify-center">
            <button
              onClick={closeSchedule}
              className="relative font-extrabold text-white uppercase tracking-wide px-12 py-3 transition-all group"
              style={{ transform: 'skewX(-12deg)' }}
            >
              <span
                className="absolute inset-0 rounded-md group-hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 100%)',
                  boxShadow: '0 0 20px rgba(255,106,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
                aria-hidden
              />
              <span className="relative text-sm" style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>
                Fechar
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
