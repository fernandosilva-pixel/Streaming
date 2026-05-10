import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  const isPaid = body.status === 'PAID' || body.transactionType === 'RECEIVEPIX'
  const txId = body.transactionId ?? body.transaction_id ?? body.pix_id ?? body.id

  if (isPaid && txId) {
    await supabase.from('payments')
      .update({ status: 'PAID' })
      .eq('transaction_id', String(txId))
  }

  return NextResponse.json({ ok: true })
}
