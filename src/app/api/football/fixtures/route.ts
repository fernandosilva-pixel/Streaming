import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

  const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
    headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! },
    next: { revalidate: 300 },
  })

  const data = await res.json()
  return NextResponse.json(data)
}
