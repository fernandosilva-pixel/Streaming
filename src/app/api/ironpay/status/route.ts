import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const IRONPAY_BASE = 'https://api.ironpayapp.com.br/api/public/v1'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hash = searchParams.get('transaction_hash')
  const streamId = searchParams.get('stream_id')
  const userEmail = searchParams.get('user_email')

  if (!hash) return NextResponse.json({ error: 'hash obrigatório' }, { status: 400 })

  const res = await fetch(
    `${IRONPAY_BASE}/transactions/${hash}?api_token=${process.env.IRONPAY_API_TOKEN}`,
    { headers: { Accept: 'application/json' } }
  )

  if (!res.ok) {
    console.error('IronPay status fetch failed:', res.status)
    return NextResponse.json({ status: 'pending' })
  }

  const data = await res.json()
  console.log('IronPay status response:', JSON.stringify(data))

  const status: string = (
    data.payment_status ??
    data.status ??
    data.transaction?.status ??
    data.data?.status ??
    'pending'
  ).toLowerCase()

  if ((status === 'paid' || status === 'approved') && streamId && userEmail) {
    const { data: tx } = await supabase
      .from('ironpay_transactions')
      .select('amount')
      .eq('transaction_hash', hash)
      .maybeSingle()

    await supabase.from('payments').insert({
      stream_id: streamId,
      user_phone: userEmail,
      status: 'PAID',
      amount: tx ? tx.amount / 100 : 0,
    })

    await supabase
      .from('ironpay_transactions')
      .update({ status: 'paid' })
      .eq('transaction_hash', hash)
  }

  return NextResponse.json({ status })
}
