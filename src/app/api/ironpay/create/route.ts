import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const IRONPAY_BASE = 'https://api.ironpayapp.com.br/api/public/v1'
const OFFER_HASH = 'ondjhpeeag'

export async function POST(req: NextRequest) {
  const { stream_id, user_email, user_name, card } = await req.json()
  if (!stream_id || !user_email || !user_name || !card) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const { data: stream } = await supabase
    .from('streams')
    .select('charge_amount, title')
    .eq('id', stream_id)
    .maybeSingle()

  if (!stream) return NextResponse.json({ error: 'Transmissão não encontrada' }, { status: 404 })

  const amountInCents = Math.round(stream.charge_amount * 100)

  // number deve vir formatado com espaços: "4111 1111 1111 1111"
  const body = {
    amount: amountInCents,
    offer_hash: OFFER_HASH,
    payment_method: 'credit_card',
    card: {
      number: card.number,
      holder_name: card.holder_name,
      exp_month: Number(card.exp_month),
      exp_year: Number(card.exp_year),
      cvv: String(card.cvv),
    },
    customer: {
      name: user_name,
      email: user_email,
      phone_number: '11999999999',
      document: '09115751031',
    },
    installments: 1,
    postback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/ironpay/webhook`,
  }

  console.log('IronPay request body:', JSON.stringify(body))

  const token = process.env.IRONPAY_API_TOKEN
  const res = await fetch(
    `${IRONPAY_BASE}/transactions?api_token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error('IronPay error:', res.status, JSON.stringify(data))
    return NextResponse.json(
      { error: data.message ?? data.error ?? 'Erro ao processar pagamento' },
      { status: 400 }
    )
  }

  console.log('IronPay create response:', JSON.stringify(data))

  const transactionHash = data.hash ?? data.transaction_hash ?? String(data.id ?? '')
  const status: string = (data.payment_status ?? data.status ?? 'pending').toLowerCase()

  if (status === 'failed' || status === 'refused' || status === 'canceled') {
    return NextResponse.json(
      { error: 'Pagamento recusado pelo banco. Verifique os dados do cartão e tente novamente.' },
      { status: 400 }
    )
  }

  await supabase.from('ironpay_transactions').insert({
    transaction_hash: transactionHash,
    stream_id,
    user_email,
    amount: amountInCents,
    status,
  })

  if (status === 'paid' || status === 'approved') {
    await supabase.from('payments').insert({
      stream_id,
      user_phone: user_email,
      status: 'PAID',
      amount: stream.charge_amount,
    })
  }

  return NextResponse.json({ transaction_hash: transactionHash, status })
}
