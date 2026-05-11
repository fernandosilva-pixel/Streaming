import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getBspayToken(): Promise<string | null> {
  const credentials = btoa(`${process.env.BSPAY_CLIENT_ID}:${process.env.BSPAY_API_KEY}`)
  const res = await fetch('https://api.bspay.co/v2/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export async function POST() {
  const { data: pending } = await supabase
    .from('payments')
    .select('id, transaction_id')
    .eq('status', 'PENDING')
    .not('transaction_id', 'is', null)

  if (!pending?.length) return NextResponse.json({ updated: 0 })

  const token = await getBspayToken()
  if (!token) return NextResponse.json({ error: 'BSPay auth failed' }, { status: 500 })

  const results = await Promise.all(
    pending.map(async (payment) => {
      try {
        const res = await fetch('https://api.bspay.co/v2/consult-transaction', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pix_id: payment.transaction_id }),
          signal: AbortSignal.timeout(8000),
        })
        const data = await res.json()
        const status = data?.requestBody?.status ?? data?.status
        if (status === 'PAID') {
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
