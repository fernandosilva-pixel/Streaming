'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface GameEntry {
  id: string
  team1: string
  team2: string
  logo1: string
  logo2: string
  league: string
  league_logo: string
  datetime: string
}

export interface ScheduleData {
  id: string
  is_active: boolean
  title: string
  games: GameEntry[]
}

interface ScheduleContextType {
  scheduleData: ScheduleData | null
  isOpen: boolean
  openSchedule: () => void
  closeSchedule: () => void
  hasGames: boolean
}

const ScheduleContext = createContext<ScheduleContextType>({
  scheduleData: null,
  isOpen: false,
  openSchedule: () => {},
  closeSchedule: () => {},
  hasGames: false,
})

const IS_MOCK = process.env.NEXT_PUBLIC_SUPABASE_MOCK === 'true'

function getLocalSchedule(): ScheduleData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('schedule_data')
    if (raw) return JSON.parse(raw) as ScheduleData
  } catch {}
  return null
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (IS_MOCK) {
      setScheduleData(getLocalSchedule())
      const handler = (e: StorageEvent) => {
        if (e.key === 'schedule_data' && e.newValue) {
          try { setScheduleData(JSON.parse(e.newValue)) } catch {}
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }

    async function loadSchedule() {
      const { data } = await supabase
        .from('schedule_notification')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        if (data.is_active) setScheduleData(data)
        else setScheduleData(null)
      } else {
        setScheduleData(null)
      }
    }

    loadSchedule()

    const onFocus = () => loadSchedule()
    const onVisibility = () => { if (document.visibilityState === 'visible') loadSchedule() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    const channel = supabase
      .channel('schedule-notification-ctx')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'schedule_notification' }, payload => {
        const updated = payload.new as ScheduleData
        if (updated.is_active) setScheduleData(updated)
        else setScheduleData(null)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'schedule_notification' }, payload => {
        const row = payload.new as ScheduleData
        if (row.is_active) setScheduleData(row)
      })
      .subscribe()

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <ScheduleContext.Provider value={{
      scheduleData,
      isOpen,
      openSchedule: () => setIsOpen(true),
      closeSchedule: () => setIsOpen(false),
      hasGames: (scheduleData?.is_active ?? false) && (scheduleData?.games?.length ?? 0) > 0,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export const useSchedule = () => useContext(ScheduleContext)
