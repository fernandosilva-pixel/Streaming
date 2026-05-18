import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const transaction_id = searchParams.get('transaction_id')
  if (!transaction_id) return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })

  const res = await fetch(`https://bank-api.asapcodes.com/payins/${transaction_id}`, {
    headers: { 'x-api-key': process.env.ASAP_API_KEY! },
  })

  if (!res.ok) return NextResponse.json({ status: 'PENDING' })

  const data = await res.json()
  return NextResponse.json({ status: data.status ?? 'PENDING' })
}
