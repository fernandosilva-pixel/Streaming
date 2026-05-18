import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const transactionId = body.id ?? body.transaction_id
  const status = body.status

  if (!transactionId || status !== 'PAID') {
    return NextResponse.json({ ok: true })
  }

  const { data: payment } = await supabase
    .from('plan_payments')
    .select('user_email')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (!payment) return NextResponse.json({ ok: true })

  await supabase
    .from('plan_payments')
    .update({ status: 'PAID' })
    .eq('transaction_id', transactionId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await supabase
    .from('registrations')
    .update({ plan: 'mensal', plan_expires_at: expiresAt.toISOString() })
    .eq('email', payment.user_email)

  return NextResponse.json({ ok: true })
}
