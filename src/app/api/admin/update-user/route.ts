import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, email, password } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (name !== undefined && name !== '') updates.name = name
  if (password !== undefined && password !== '') updates.password = password
  if (email !== undefined && email !== '') {
    const digits = email.replace(/\D/g, '')
    // If it's a pure phone number (only digits, 8+ chars), store in @futzone.app format
    if (/^\d{8,}$/.test(email.trim())) {
      const withCountry = digits.startsWith('55') ? digits : '55' + digits
      updates.email = `${withCountry}@futzone.app`
      updates.phone = digits
    } else {
      updates.email = email.trim()
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await supabase.from('registrations').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
