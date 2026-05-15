import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAuthorized(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token === process.env.ADMIN_SECRET
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { session_ids } = await req.json()
  if (!Array.isArray(session_ids) || session_ids.length === 0) {
    return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
  }

  await supabase.from('support_messages').delete().in('session_id', session_ids)
  await supabase.from('support_statuses').delete().in('session_id', session_ids)

  return NextResponse.json({ ok: true })
}
