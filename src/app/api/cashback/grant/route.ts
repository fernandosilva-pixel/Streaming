import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { user_email, stream_id } = await req.json()
  if (!user_email || !stream_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const base = user_email.endsWith('@futzone.app') ? user_email.split('@')[0] : user_email
  const withCountry = base.startsWith('55') ? base : '55' + base
  const withoutCountry = base.startsWith('55') ? base.slice(2) : base
  const variants = Array.from(new Set([user_email, base, withCountry, withoutCountry, `${withCountry}@futzone.app`, `${withoutCountry}@futzone.app`]))

  const [{ count: payCount }, { count: planCount }, { count: usesCount }] = await Promise.all([
    supabase.from('payments').select('id', { count: 'exact', head: true }).in('user_phone', variants).eq('status', 'PAID'),
    supabase.from('plan_payments').select('id', { count: 'exact', head: true }).in('user_email', variants).eq('status', 'PAID'),
    supabase.from('cashback_uses').select('id', { count: 'exact', head: true }).in('user_email', variants),
  ])

  const totalPaid = (payCount ?? 0) + (planCount ?? 0)
  if (Math.floor(totalPaid / 5) <= (usesCount ?? 0)) {
    return NextResponse.json({ eligible: false })
  }

  await supabase.from('cashback_uses').insert({ user_email, stream_id })
  return NextResponse.json({ eligible: true, total_paid: totalPaid })
}
