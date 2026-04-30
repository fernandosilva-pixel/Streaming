import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.status === 'PAID' || body.transactionType === 'RECEIVEPIX') {
    await supabase.from('payments')
      .update({ status: 'PAID' })
      .eq('transaction_id', body.transactionId)
  }

  return NextResponse.json({ ok: true })
}
