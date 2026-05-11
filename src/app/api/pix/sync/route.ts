import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  const { data: pending } = await supabase
    .from('payments')
    .select('id, transaction_id')
    .eq('status', 'PENDING')
    .not('transaction_id', 'is', null)

  if (!pending?.length) return NextResponse.json({ updated: 0 })

  const results = await Promise.all(
    pending.map(async (payment) => {
      try {
        const res = await fetch(`https://bank-api.asapcodes.com/payins/${payment.transaction_id}`, {
          headers: { 'x-api-key': process.env.ASAP_API_KEY! },
          signal: AbortSignal.timeout(8000),
        })
        const data = await res.json()
        if (data?.status === 'PAID') {
          await supabase.from('payments').update({ status: 'PAID' }).eq('id', payment.id)
          return 1
        }
      } catch { /* skip individual failures */ }
      return 0
    })
  )

  const updated = results.reduce((a, b) => a + b, 0 as number)
  return NextResponse.json({ updated, checked: pending.length })
}
