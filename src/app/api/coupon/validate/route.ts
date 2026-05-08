import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { stream_id, code, user_phone } = await req.json()

  if (!stream_id || !code || !user_phone) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data: stream, error: streamErr } = await supabase
    .from('streams')
    .select('coupon_enabled, coupon_code, coupon_quantity')
    .eq('id', stream_id)
    .single()

  if (streamErr || !stream) {
    return NextResponse.json({ error: 'Transmissão não encontrada' }, { status: 404 })
  }

  if (!stream.coupon_enabled) {
    return NextResponse.json({ error: 'Códigos desativados para esta transmissão' }, { status: 403 })
  }

  if (!stream.coupon_code || stream.coupon_code.trim().toLowerCase() !== code.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  // Check if user already used this coupon
  const { data: existingUse } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('stream_id', stream_id)
    .eq('user_phone', user_phone)
    .maybeSingle()

  if (existingUse) {
    return NextResponse.json({ error: 'Você já usou este código' }, { status: 409 })
  }

  // Check available quantity
  const { count } = await supabase
    .from('coupon_uses')
    .select('id', { count: 'exact', head: true })
    .eq('stream_id', stream_id)

  const used = count ?? 0
  if (used >= stream.coupon_quantity) {
    return NextResponse.json({ error: 'Todos os códigos já foram utilizados' }, { status: 410 })
  }

  // Register use
  const { error: insertErr } = await supabase
    .from('coupon_uses')
    .insert({ stream_id, user_phone })

  if (insertErr) {
    return NextResponse.json({ error: 'Erro ao registrar código' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, remaining: stream.coupon_quantity - used - 1 })
}
