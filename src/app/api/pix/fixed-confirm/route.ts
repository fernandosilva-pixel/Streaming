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
    const { stream_id, stream_title, user_phone, referral_code } = await req.json()
    if (!stream_id || !user_phone) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })

    const { error } = await supabase.from('payments').insert({
      stream_id,
      stream_title: stream_title ?? null,
      user_phone,
      status: 'PAID',
      referral_code: referral_code ?? null,
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
