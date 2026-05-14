import { NextRequest, NextResponse } from 'next/server'

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!
const TOKEN = process.env.ZAPI_TOKEN!
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN!
// ZAPI_GROUP_ID can be stored as "120363407173912995-group" or "120363407173912995@g.us"
const RAW_GROUP_ID = process.env.ZAPI_GROUP_ID!
// Normalize to @g.us format required by add-participant endpoint
const GROUP_ID = RAW_GROUP_ID.replace('-group', '@g.us')
const BASE = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

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
    const addRes = await fetch(`${BASE}/update-group-participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_TOKEN },
      body: JSON.stringify({ action: 'add', phones: [withCountry], groupId: GROUP_ID }),
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
