import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const transaction_id = searchParams.get('transaction_id')

  if (!transaction_id) return NextResponse.json({ status: 'PENDING' })

  // 1. Verifica banco PRIMEIRO — webhook pode já ter marcado como PAID
  const { data: dbPayment } = await supabase.from('payments')
    .select('status')
    .eq('transaction_id', transaction_id)
    .maybeSingle()

  if (dbPayment?.status === 'PAID') return NextResponse.json({ status: 'PAID' })

  // 2. Consulta Asap Bank para status ao vivo
  try {
    const asapRes = await fetch(`https://bank-api.asapcodes.com/payins/${transaction_id}`, {
      headers: { 'x-api-key': process.env.ASAP_API_KEY! },
      signal: AbortSignal.timeout(8000),
    })
    const asapData = await asapRes.json()
    const status = asapData?.status
    if (status === 'PAID') {
      const { data: payment } = await supabase.from('payments')
        .select('user_phone, stream_title, amount, status')
        .eq('transaction_id', transaction_id)
        .maybeSingle()

      if (payment?.status !== 'PAID') {
        await supabase.from('payments').update({ status: 'PAID' }).eq('transaction_id', transaction_id)

        const msg = [
          '💰 <b>Nova venda confirmada — FutZone</b>',
          '<b>Tipo: PIX avulso</b>',
          payment?.user_phone ? `<b>Usuário: ${payment.user_phone}</b>` : null,
          payment?.stream_title ? `<b>Jogo: ${payment.stream_title}</b>` : null,
          payment?.amount ? `<b>Valor: R$ ${Number(payment.amount).toFixed(2).replace('.', ',')}</b>` : null,
        ].filter(Boolean).join('\n')
        sendTelegram(msg).catch(() => {})
      } else {
        await supabase.from('payments').update({ status: 'PAID' }).eq('transaction_id', transaction_id)
      }

      return NextResponse.json({ status: 'PAID' })
    }
    return NextResponse.json({ status: status ?? 'PENDING' })
  } catch {
    // Asap Bank indisponível — retorna status do banco
  }

  return NextResponse.json({ status: dbPayment?.status ?? 'PENDING' })
}
