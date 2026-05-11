import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const IRONPAY_BASE = 'https://api.ironpayapp.com.br/api/public/v1'
const OFFER_HASH = 'ondjhpeeag'
const PRODUCT_HASH = '6fizrgie7y'

export async function POST(req: NextRequest) {
  const { stream_id, user_email, user_name, card_token } = await req.json()
  if (!stream_id || !user_email || !user_name || !card_token) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const { data: stream } = await supabase
    .from('streams')
    .select('charge_amount, title')
    .eq('id', stream_id)
    .maybeSingle()

  if (!stream) return NextResponse.json({ error: 'Transmissão não encontrada' }, { status: 404 })

  const amountInCents = Math.round(stream.charge_amount * 100)

  const body = {
    amount: amountInCents,
    offer_hash: OFFER_HASH,
    payment_method: 'credit_card',
    card_token,
    customer: {
      name: user_name,
      email: user_email,
      phone_number: '00000000000',
      document: '54074646838',
      street_name: 'N/A',
      number: '0',
      complement: '',
      neighborhood: 'N/A',
      city: 'N/A',
      state: 'SP',
      zip_code: '00000000',
    },
    cart: [{
      product_hash: PRODUCT_HASH,
      title: stream.title || 'Acesso à transmissão',
      price: amountInCents,
      quantity: 1,
      operation_type: 1,
      tangible: false,
    }],
    installments: 1,
    expire_in_days: 1,
    transaction_origin: 'api',
    postback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/ironpay/webhook`,
  }

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

  const transactionHash = data.hash ?? data.transaction_hash ?? String(data.id ?? '')
  const status: string = data.status ?? 'pending'

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
