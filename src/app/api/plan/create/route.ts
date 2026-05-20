import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { user_email, user_name, amount, plan_type = 'mensal' } = await req.json()

  const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = req.headers.get('host')
  const webhookUrl = `${proto}://${host}/api/plan/webhook`

  const idempotencyKey = crypto.randomUUID()
  const payerEmail = user_email.includes('@') ? user_email : `${user_email}@futzonejogos.site`
  const description = plan_type === 'semanal' ? 'Plano Semanal FutZone' : 'Plano Mensal FutZone'

  const res = await fetch('https://bank-api.asapcodes.com/payins', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ASAP_API_KEY!,
      'idempotency-key': idempotencyKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      description,
      webhookUrl,
      payer: {
        name: user_name || 'Cliente',
        document: '00000000000',
        email: payerEmail,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Falha ao criar cobrança', detail: text }, { status: 500 })
  }

  const data = await res.json()

  const { error } = await supabase.from('plan_payments').insert({
    user_email,
    transaction_id: data.id,
    amount,
    plan_type,
    status: 'PENDING',
    qrcode: data.qrCode ?? '',
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction_id: data.id, qrcode: data.qrCode })
}
