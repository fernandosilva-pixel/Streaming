'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSchedule } from '@/contexts/ScheduleContext'

interface NotificationBellProps {
  homeTeam: string
  awayTeam: string
  matchTime: string
}

export default function NotificationBell({ homeTeam: _homeTeam, awayTeam: _awayTeam, matchTime: _matchTime }: NotificationBellProps) {
  const { hasGames, openSchedule, scheduleData } = useSchedule()
  const gameCount = scheduleData?.games?.length ?? 0
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    if (hasGames) setClicked(false)
  }, [hasGames])

  function handleClick() {
    setClicked(true)
    openSchedule()
  }

  return (
    <>
      <style>{`
        @keyframes bellShake {
          0%,100% { transform: rotate(0deg); }
          10%      { transform: rotate(16deg); }
          20%      { transform: rotate(-14deg); }
          30%      { transform: rotate(12deg); }
          40%      { transform: rotate(-10deg); }
          50%      { transform: rotate(7deg); }
          60%      { transform: rotate(-5deg); }
          70%      { transform: rotate(3deg); }
          80%      { transform: rotate(-2deg); }
          90%      { transform: rotate(1deg); }
        }
      `}</style>

      <AnimatePresence>
        {hasGames && (
          <motion.button
            key="bell-btn"
            onClick={handleClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            className="relative flex items-center justify-center hover:opacity-80 active:scale-95"
            style={{ width: 34, height: 34 }}
            aria-label="Próximos jogos"
          >
            <span
              className="relative flex items-center justify-center"
              style={!clicked ? {
                animation: 'bellShake 1.4s ease-in-out infinite',
                transformOrigin: 'top center',
              } : undefined}
            >
              <Bell className="w-5 h-5" style={{ color: '#FF6A00' }} />
              <span
                className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white font-black"
                style={{
                  background: '#FF3B3B',
                  fontSize: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  lineHeight: 1,
                }}
              >
                {gameCount > 99 ? '99+' : gameCount}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
