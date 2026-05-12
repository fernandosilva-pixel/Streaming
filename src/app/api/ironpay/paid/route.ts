import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const streamId = searchParams.get('stream_id')
  const userEmail = searchParams.get('user_email')

  if (!streamId || !userEmail) {
    return NextResponse.json({ paid: false })
  }

  const { data } = await supabase
    .from('payments')
    .select('id')
    .eq('stream_id', streamId)
    .eq('user_phone', userEmail)
    .eq('status', 'PAID')
    .maybeSingle()

  return NextResponse.json({ paid: !!data })
}
