import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    console.error('[admin/login] supabase error:', error?.message, error?.status)
    return NextResponse.json({ error: error?.message ?? 'Email ou senha incorretos.' }, { status: 401 })
  }

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[admin/login] ADMIN_SECRET not set')
    return NextResponse.json({ error: 'Configuração inválida: ADMIN_SECRET ausente.' }, { status: 500 })
  }

  const res = NextResponse.json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  res.cookies.set('admin_token', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
