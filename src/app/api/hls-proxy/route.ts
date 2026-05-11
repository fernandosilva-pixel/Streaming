import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url')
  if (!targetUrl) return new Response('Missing url', { status: 400 })
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return new Response('Invalid url', { status: 400 })
  }

  const res = await fetch(targetUrl, { cache: 'no-store' })
  const contentType = res.headers.get('Content-Type') ?? ''

  if (targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl')) {
    const text = await res.text()
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1)
    const rewritten = text.split('\n').map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || trimmed === '') return line
      const absolute = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed
      return `/api/hls-proxy?url=${encodeURIComponent(absolute)}`
    }).join('\n')
    return new Response(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  }

  const body = await res.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': contentType || 'video/mp2t',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  })
}
