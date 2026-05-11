import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getBspayToken(): Promise<string | null> {
  const credentials = btoa(`${process.env.BSPAY_CLIENT_ID}:${process.env.BSPAY_API_KEY}`)
  const res = await fetch('https://api.bspay.co/v2/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const transaction_id = searchParams.get('transaction_id')

  if (!transaction_id) return NextResponse.json({ status: 'PENDING' })

  // 1. Verifica banco PRIMEIRO — webhook pode já ter marcado como PAID
  const { data: dbPayment } = await supabase.from('payments')
    .select('status')
    .eq('transaction_id', transaction_id)
    .maybeSingle()

  if (dbPayment?.status === 'PAID') return NextResponse.json({ status: 'PAID' })

  // 2. Se banco diz PENDING, consulta BSPay para status ao vivo
  const token = await getBspayToken()
  if (token) {
    try {
      const bsRes = await fetch('https://api.bspay.co/v2/consult-transaction', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pix_id: transaction_id }),
        signal: AbortSignal.timeout(8000),
      })
      const bsData = await bsRes.json()
      const txStatus = bsData?.requestBody?.status ?? bsData?.status
      if (txStatus === 'PAID') {
        await supabase.from('payments')
          .update({ status: 'PAID' })
          .eq('transaction_id', transaction_id)
        return NextResponse.json({ status: 'PAID' })
      }
      return NextResponse.json({ status: txStatus ?? 'PENDING' })
    } catch {
      // BSPay indisponível — retorna status do banco
    }
  }

  return NextResponse.json({ status: dbPayment?.status ?? 'PENDING' })
}
