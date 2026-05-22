import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'cashback_enabled')
    .single()

  return NextResponse.json({ enabled: data?.value !== 'false' })
}

export async function POST(req: NextRequest) {
  const { enabled } = await req.json()
  await supabase
    .from('app_settings')
    .upsert({ key: 'cashback_enabled', value: String(enabled) })
  return NextResponse.json({ ok: true })
}
