import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user_phone, user_name, referral_code } = await req.json()
    if (!user_phone || !referral_code) return NextResponse.json({ ok: false, error: 'missing fields' })

    // Verify affiliate exists with this referral_code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referral_code', referral_code)
      .eq('status', 'approved')
      .maybeSingle()

    if (!affiliate) return NextResponse.json({ ok: false, error: 'affiliate not found' })

    // upsert so duplicate registrations don't error
    const { error } = await supabase.from('referrals').upsert(
      { user_phone, user_name, referral_code },
      { onConflict: 'user_phone', ignoreDuplicates: true }
    )

    if (error) return NextResponse.json({ ok: false, error: error.message })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
