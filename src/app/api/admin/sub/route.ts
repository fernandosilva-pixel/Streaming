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

// Criar sub-admin
export async function POST(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { name, email, password, allowed_tabs } = await req.json()
  if (!name || !email || !password || !allowed_tabs?.length) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'Este e-mail já está cadastrado.'
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Salvar permissões
  const { error: permError } = await supabase.from('admin_permissions').insert({ email, name, allowed_tabs })

  if (permError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: permError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Listar sub-admins
export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data } = await supabase
    .from('admin_permissions')
    .select('email, name, allowed_tabs, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ admins: data ?? [] })
}

// Remover sub-admin
export async function DELETE(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  // Achar o user no Supabase Auth pelo e-mail
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUser = users.find(u => u.email === email)
  if (authUser) await supabase.auth.admin.deleteUser(authUser.id)

  await supabase.from('admin_permissions').delete().eq('email', email)

  return NextResponse.json({ ok: true })
}

// Atualizar abas de sub-admin
export async function PATCH(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email, allowed_tabs } = await req.json()
  if (!email || !allowed_tabs?.length) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const { error } = await supabase.from('admin_permissions').update({ allowed_tabs }).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
