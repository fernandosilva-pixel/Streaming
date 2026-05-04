import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user_phone, stream_id } = await req.json()
    if (!user_phone || !stream_id) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })

    await supabase.from('preview_used').upsert(
      { user_phone, stream_id },
      { onConflict: 'user_phone,stream_id', ignoreDuplicates: true }
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
