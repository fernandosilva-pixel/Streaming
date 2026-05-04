'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PresenceTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/compostov')) return

    let sid = sessionStorage.getItem('futzone_sid')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('futzone_sid', sid)
    }

    const stored = localStorage.getItem('futzone_user')
    const userInfo = stored ? JSON.parse(stored) as { name: string; phone: string } : null

    const channel = supabase.channel('site-presence', {
      config: { presence: { key: sid } },
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          at: Date.now(),
          page: pathname,
          name: userInfo?.name ?? null,
          phone: userInfo?.phone ?? null,
        })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [pathname])

  return null
}
