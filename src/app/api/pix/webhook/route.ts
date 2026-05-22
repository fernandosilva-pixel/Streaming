import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Asap Bank webhook payload: { id, status, eventType }
  const isPaid = body.status === 'PAID'
  const txId = body.id

  if (isPaid && txId) {
    const { data: payment } = await supabase.from('payments')
      .select('user_phone, stream_title, amount')
      .eq('transaction_id', String(txId))
      .maybeSingle()

    await supabase.from('payments')
      .update({ status: 'PAID' })
      .eq('transaction_id', String(txId))

    const valor = payment?.amount ? `R$ ${Number(payment.amount).toFixed(2).replace('.', ',')}` : ''
    const msg = `Nova venda confirmada${valor ? ` - ${valor}` : ''} 💰`

    sendTelegram(msg).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
