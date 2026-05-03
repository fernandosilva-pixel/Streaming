import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { stream_id, user_phone, user_name, amount, referral_code } = await req.json()

  const external_id = `${stream_id}-${user_phone}-${Date.now()}`
  const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = req.headers.get('host')
  const postbackUrl = `${proto}://${host}/api/pix/webhook`

  const credentials = Buffer.from(`${process.env.BSPAY_CLIENT_ID}:${process.env.BSPAY_API_KEY}`).toString('base64')
  const tokenRes = await fetch('https://api.bspay.co/v2/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    return NextResponse.json({ error: 'TOKEN_FAILED', detail: text }, { status: 500 })
  }

  const { access_token } = await tokenRes.json()

  const res = await fetch('https://api.bspay.co/v2/pix/qrcode', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      postbackUrl,
      external_id,
      payerQuestion: 'Acesso à transmissão ao vivo',
      payer: {
        name: user_name || 'Cliente',
        document: user_phone,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Falha ao criar cobrança', detail: text }, { status: 500 })
  }

  const data = await res.json()

  const transactionId = data.transactionId ?? data.transaction_id ?? data.id
  const qrcode = data.qrcode ?? data.qr_code ?? data.emv

  const { error: insertError } = await supabase.from('payments').insert({
    stream_id,
    user_phone,
    transaction_id: transactionId,
    external_id,
    amount,
    status: 'PENDING',
    qrcode: qrcode ?? '',
    referral_code: referral_code ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Falha ao salvar pagamento', detail: insertError.message, bspay_response: data }, { status: 500 })
  }

  return NextResponse.json({
    transaction_id: transactionId,
    qrcode,
  })
}
