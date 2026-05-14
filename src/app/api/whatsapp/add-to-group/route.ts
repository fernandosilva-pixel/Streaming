import { NextRequest, NextResponse } from 'next/server'

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!
const TOKEN = process.env.ZAPI_TOKEN!
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN!
const GROUP_ID = process.env.ZAPI_GROUP_ID!
const BASE = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  // Normalize: strip non-digits, ensure starts with 55
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`

  try {
    // Check if number has WhatsApp
    const checkRes = await fetch(`${BASE}/phone-exists/${withCountry}`, {
      headers: { 'Client-Token': CLIENT_TOKEN },
    })
    const checkData = await checkRes.json()

    if (!checkData.exists) {
      return NextResponse.json({ ok: false, reason: 'no_whatsapp' })
    }

    // Add to group
    const addRes = await fetch(`${BASE}/add-participant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_TOKEN },
      body: JSON.stringify({ phone: withCountry, groupId: GROUP_ID }),
    })
    const addData = await addRes.json()

    if (!addRes.ok) {
      return NextResponse.json({ ok: false, reason: addData }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, reason: String(err) }, { status: 500 })
  }
}
