import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { transaction_hash, status, amount } = body

  if (!transaction_hash) return NextResponse.json({ ok: false }, { status: 400 })

  const { data: tx } = await supabase
    .from('ironpay_transactions')
    .select('*')
    .eq('transaction_hash', transaction_hash)
    .maybeSingle()

  if (!tx) return NextResponse.json({ ok: true })

  await supabase
    .from('ironpay_transactions')
    .update({ status })
    .eq('transaction_hash', transaction_hash)

  if (status === 'paid' || status === 'approved') {
    await supabase.from('payments').insert({
      stream_id: tx.stream_id,
      user_phone: tx.user_email,
      status: 'PAID',
      amount: (amount ?? tx.amount) / 100,
    })
  }

  return NextResponse.json({ ok: true })
}
