import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!
const COOLDOWN_MINUTES = 10

async function sendTelegram(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

export async function POST(req: NextRequest) {
  const { error_type, error_details, stream_url } = await req.json()

  // Verifica se já foi notificado nos últimos 10 minutos
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
    '🚨 <b>Alerta FutZone — CDN com problema</b>',
    '',
    `<b>Erro:</b> <code>${error_type}: ${error_details}</code>`,
    stream_url ? `<b>Stream:</b> <code>${stream_url}</code>` : null,
    '',
    'Verifique a conta da Bunny CDN e troque a URL base no painel se necessário.',
  ].filter(Boolean).join('\n')

  await sendTelegram(msg)

  return NextResponse.json({ sent: true })
}
