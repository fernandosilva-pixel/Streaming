'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReferralTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('futzone_ref', ref)
      void supabase.rpc('increment_affiliate_clicks', { code: ref })
    }
  }, [])
  return null
}
