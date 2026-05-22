'use client'

import { useEffect, useRef, useState } from 'react'

interface HlsPlayerProps {
  src: string
  style?: React.CSSProperties
  className?: string
}

export default function HlsPlayer({ src, style, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setErrorMsg(null)

    // Use proxy only for HTTP sources (no CORS). HTTPS CDN URLs load directly.
    const proxied = src.startsWith('https://') ? src : `/api/hls-proxy?url=${encodeURIComponent(src)}`

    // Use native HLS only on real Safari (not Chrome on macOS, which also reports HLS support
    // but can't handle proxy-rewritten segment URLs correctly)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxied
      return
    }

    let hls: import('hls.js').default | null = null

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        // Fallback for iOS / browsers without MSE
        video.src = proxied
        return
      }

      hls = new Hls({ enableWorker: false, liveSyncDurationCount: 3 })
      hls.loadSource(proxied)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true
          video.play().catch(() => {})
        })
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setErrorMsg(`${data.type}: ${data.details}`)
          fetch('/api/cdn-error/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error_type: data.type, error_details: data.details, stream_url: proxied }),
          }).catch(() => {})
        }
      })

      // Volta ao vivo ao dar play após pausa
      video.addEventListener('play', () => {
        if (hls && hls.liveSyncPosition != null) {
          video.currentTime = hls.liveSyncPosition
        }
      })
    })

    return () => { hls?.destroy() }
  }, [src])

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        controls
        playsInline
        className={className}
        style={style}
      />
      {errorMsg && (
        <div style={{
          position: 'absolute', top: 8, left: 8, right: 8, zIndex: 50,
          background: 'rgba(0,0,0,0.8)', color: '#f87171', fontSize: 12,
          padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace',
        }}>
          Erro HLS: {errorMsg}
        </div>
      )}
    </>
  )
}
