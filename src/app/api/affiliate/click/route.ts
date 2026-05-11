import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ ok: false })

  const { data } = await supabase
    .from('affiliates')
    .select('id, clicks')
    .eq('referral_code', code)
    .single()

  if (!data) return NextResponse.json({ ok: false })

  await supabase
    .from('affiliates')
    .update({ clicks: data.clicks + 1 })
    .eq('id', data.id)

  return NextResponse.json({ ok: true })
}
