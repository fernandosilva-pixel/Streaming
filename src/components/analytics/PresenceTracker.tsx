'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PresenceTracker() {
  useEffect(() => {
    let sid = sessionStorage.getItem('futzone_sid')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('futzone_sid', sid)
    }

    const channel = supabase.channel('site-presence', {
      config: { presence: { key: sid } },
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ at: Date.now() })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return null
}
