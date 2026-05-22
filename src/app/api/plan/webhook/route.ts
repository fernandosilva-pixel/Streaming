import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'

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
    .select('user_email, plan_type')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (!payment) return NextResponse.json({ ok: true })

  await supabase
    .from('plan_payments')
    .update({ status: 'PAID' })
    .eq('transaction_id', transactionId)

  const days = payment.plan_type === 'semanal' ? 7 : 30
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  await supabase
    .from('registrations')
    .update({ plan: payment.plan_type ?? 'mensal', plan_expires_at: expiresAt.toISOString() })
    .eq('email', payment.user_email)

  const planLabel = payment.plan_type === 'semanal' ? 'Semanal (7 dias)' : 'Mensal (30 dias)'
  const msg = [
    '💰 <b>Nova venda confirmada — FutZone</b>',
    `<b>Tipo: Assinatura ${planLabel}</b>`,
    `<b>Usuário: ${payment.user_email}</b>`,
  ].join('\n')
  sendTelegram(msg).catch(() => {})

  return NextResponse.json({ ok: true })
}
