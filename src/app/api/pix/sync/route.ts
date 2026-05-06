import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getBspayToken(): Promise<string | null> {
  const credentials = Buffer.from(`${process.env.BSPAY_CLIENT_ID}:${process.env.BSPAY_API_KEY}`).toString('base64')
  const res = await fetch('https://api.bspay.co/v2/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
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

  let updated = 0
  for (const payment of pending) {
    try {
      const res = await fetch('https://api.bspay.co/v2/consult-transaction', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pix_id: payment.transaction_id }),
      })
      const data = await res.json()
      const status = data?.requestBody?.status ?? data?.status
      if (status === 'PAID') {
        await supabase.from('payments').update({ status: 'PAID' }).eq('id', payment.id)
        updated++
      }
    } catch { /* skip individual failures */ }
  }

  return NextResponse.json({ updated, checked: pending.length })
}
