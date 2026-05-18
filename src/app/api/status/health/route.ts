import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ping(url: string, timeoutMs = 5000, anyResponseIsOk = false): Promise<{ ok: boolean; latencyMs: number; status?: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal, method: 'HEAD', cache: 'no-store' })
    clearTimeout(timer)
    // anyResponseIsOk: considera "up" se o servidor respondeu qualquer coisa (ex: RTMP server que retorna 5xx no HTTP)
    return { ok: anyResponseIsOk ? true : (res.ok || res.status < 500), latencyMs: Date.now() - start, status: res.status }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

async function checkSupabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('site_settings').select('id').limit(1).maybeSingle()
    return { ok: !error, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

async function checkAsapBank(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://bank-api.asapcodes.com/payins?limit=1', {
      signal: controller.signal,
      method: 'GET',
      headers: { 'x-api-key': process.env.ASAP_API_KEY ?? '' },
      cache: 'no-store',
    })
    clearTimeout(timer)
    return { ok: res.status !== 0 && res.status < 500, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

export async function GET() {
  const [railway, bunny, stream, supabase, asap] = await Promise.all([
    ping(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://localhost:3000'}/api/pix/sync`, 5000),
    ping('https://live.futzonejogos.site/', 5000),
    ping('http://187.77.55.131', 5000, true),
    checkSupabase(),
    checkAsapBank(),
  ])

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    services: {
      railway: { ...railway, name: 'Railway' },
      bunny: { ...bunny, name: 'Bunny CDN' },
      stream: { ...stream, name: 'Servidor de Stream' },
      supabase: { ...supabase, name: 'Supabase' },
      asap: { ...asap, name: 'ASAP Bank' },
    },
  })
}
