import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'cdn_base_url')
    .maybeSingle()
  return NextResponse.json({ value: data?.value ?? null })
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url || typeof url !== 'string') return NextResponse.json({ ok: false }, { status: 400 })

  const cleanUrl = url.trim().replace(/\/$/, '')

  // Busca URL antiga para atualizar as streams
  const { data: current } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'cdn_base_url')
    .maybeSingle()
  const oldUrl = current?.value ?? null

  await supabase
    .from('app_settings')
    .upsert({ key: 'cdn_base_url', value: cleanUrl }, { onConflict: 'key' })

  // Atualiza todas as streams HLS que usavam a URL base antiga
  if (oldUrl && oldUrl !== cleanUrl) {
    const { data: hlsStreams } = await supabase
      .from('streams')
      .select('id, hls_url')
      .not('hls_url', 'is', null)
    const toUpdate = (hlsStreams ?? []).filter((s: { hls_url: string | null }) => s.hls_url?.startsWith(oldUrl))
    await Promise.all(
      toUpdate.map((s: { id: string; hls_url: string | null }) => {
        const key = s.hls_url!.match(/\/hls\/(.+?)\.m3u8/)?.[1] ?? s.hls_url!
        return supabase.from('streams').update({ hls_url: `${cleanUrl}/hls/${key}.m3u8` }).eq('id', s.id)
      })
    )
  }

  return NextResponse.json({ ok: true, value: cleanUrl })
}
