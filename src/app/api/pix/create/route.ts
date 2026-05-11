import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { stream_id, user_phone, user_name, amount, referral_code } = await req.json()

  const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = req.headers.get('host')
  const webhookUrl = `${proto}://${host}/api/pix/webhook`

  const idempotencyKey = crypto.randomUUID()
  const payerEmail = user_phone.includes('@') ? user_phone : `${user_phone}@futzonejogos.site`

  const res = await fetch('https://bank-api.asapcodes.com/payins', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ASAP_API_KEY!,
      'idempotency-key': idempotencyKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      description: 'Acesso à transmissão ao vivo',
      webhookUrl,
      payer: {
        name: user_name || 'Cliente',
        document: '00000000000',
        email: payerEmail,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Falha ao criar cobrança', detail: text }, { status: 500 })
  }

  const data = await res.json()

  const { error: insertError } = await supabase.from('payments').insert({
    stream_id,
    user_phone,
    transaction_id: data.id,
    external_id: idempotencyKey,
    amount,
    status: 'PENDING',
    qrcode: data.qrCode ?? '',
    referral_code: referral_code ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Falha ao salvar pagamento', detail: insertError.message, asap_response: data }, { status: 500 })
  }

  return NextResponse.json({
    transaction_id: data.id,
    qrcode: data.qrCode,
  })
}
