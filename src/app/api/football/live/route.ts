import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${id}`, {
    headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! },
    next: { revalidate: 60 },
  })

  const data = await res.json()
  return NextResponse.json(data)
}
