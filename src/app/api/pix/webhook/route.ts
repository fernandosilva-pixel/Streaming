import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    await supabase.from('payments')
      .update({ status: 'PAID' })
      .eq('transaction_id', String(txId))
  }

  return NextResponse.json({ ok: true })
}
