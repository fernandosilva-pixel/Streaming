import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getBspayToken(): Promise<string | null> {
  const credentials = Buffer.from(`${process.env.BSPAY_CLIENT_ID}:${process.env.BSPAY_API_KEY}`).toString('base64')
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

  // Consulta BSPay diretamente com o endpoint correto
  const token = await getBspayToken()
  if (token) {
    const bsRes = await fetch('https://api.bspay.co/v2/consult-transaction', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pix_id: transaction_id }),
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
  }

  // Fallback: verifica no banco
  const { data: payment } = await supabase.from('payments')
    .select('status')
    .eq('transaction_id', transaction_id)
    .maybeSingle()

  return NextResponse.json({ status: payment?.status ?? 'PENDING' })
}
