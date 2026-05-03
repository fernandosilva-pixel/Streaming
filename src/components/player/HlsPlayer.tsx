'use client'

import { useEffect, useRef } from 'react'

interface HlsPlayerProps {
  src: string
  style?: React.CSSProperties
  className?: string
}

export default function HlsPlayer({ src, style, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const proxied = `/api/hls-proxy?url=${encodeURIComponent(src)}`

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxied
      return
    }

    let hls: import('hls.js').default | null = null

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) return
      hls = new Hls()
      hls.loadSource(proxied)
      hls.attachMedia(video)
    })

    return () => { hls?.destroy() }
  }, [src])

  return (
    <video
      ref={videoRef}
      autoPlay
      controls
      playsInline
      className={className}
      style={style}
    />
  )
}
