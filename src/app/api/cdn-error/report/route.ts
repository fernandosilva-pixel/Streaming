import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COOLDOWN_MINUTES = 1

export async function POST(req: NextRequest) {
  const { error_type, error_details, stream_url } = await req.json()

  const since = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('cdn_error_log')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ sent: false, reason: 'cooldown' })
  }

  await supabase.from('cdn_error_log').insert({ error_type, error_details, stream_url: stream_url ?? null })

  const msg = [
    '🚨 <b>Alerta FutZone — CDN com problema 🚨</b>',
    `<b>Erro: ${error_type}: ${error_details}</b>`,
    stream_url ? `<b>Stream: ${stream_url}</b>` : null,
    '<b>Conta do Bunny SUSPENSA troque a URL base no painel por uma conta ativa.</b>',
  ].filter(Boolean).join('\n')

  await sendTelegram(msg)

  return NextResponse.json({ sent: true })
}
