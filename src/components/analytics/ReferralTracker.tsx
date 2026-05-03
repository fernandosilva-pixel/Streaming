'use client'

import { useEffect } from 'react'

export default function ReferralTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('futzone_ref', ref)
      fetch(`/api/affiliate/click?code=${encodeURIComponent(ref)}`)
    }
  }, [])
  return null
}
