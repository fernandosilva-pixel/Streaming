import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('registrations')
    .select('phone, name')
    .is('whatsapp_added_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter valid BR numbers: starts with 55, 12 or 13 digits total
  const valid = (data ?? []).filter(r => {
    const digits = r.phone?.replace(/\D/g, '') ?? ''
    return digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
  })

  return NextResponse.json({ phones: valid.map(r => r.phone.replace(/\D/g, '')) })
}
