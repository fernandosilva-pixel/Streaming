import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('IronPay webhook:', JSON.stringify(body))

  const { transaction_hash, payment_status, amount } = body

  // stream_id e user_email podem vir via utm_source/utm_campaign (checkout redirect)
  // ou via transaction_hash (API direta)
  const utmStreamId = body.utm_source && body.utm_source !== 'null' ? body.utm_source : null
  const utmEmail = body.utm_campaign && body.utm_campaign !== 'null'
    ? decodeURIComponent(body.utm_campaign)
    : null

  if (payment_status === 'paid' || payment_status === 'approved') {
    if (utmStreamId && utmEmail) {
      // Pagamento via checkout redirect — usa UTM params
      await supabase.from('payments').insert({
        stream_id: utmStreamId,
        user_phone: utmEmail,
        status: 'PAID',
        amount: (amount ?? 0) / 100,
      })
    } else if (transaction_hash) {
      // Pagamento via API direta — usa transaction_hash
      const { data: tx } = await supabase
        .from('ironpay_transactions')
        .select('*')
        .eq('transaction_hash', transaction_hash)
        .maybeSingle()

      if (tx) {
        await supabase.from('payments').insert({
          stream_id: tx.stream_id,
          user_phone: tx.user_email,
          status: 'PAID',
          amount: (amount ?? tx.amount) / 100,
        })

        await supabase
          .from('ironpay_transactions')
          .update({ status: 'paid' })
          .eq('transaction_hash', transaction_hash)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
