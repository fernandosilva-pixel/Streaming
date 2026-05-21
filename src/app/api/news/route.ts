import { NextResponse } from 'next/server'
import { fetchNoticiasFutebol } from '@/lib/external-apis/news'

export const runtime = 'nodejs'

export async function GET() {
  const noticias = await fetchNoticiasFutebol()

  return NextResponse.json(
    { noticias },
    {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
      },
    }
  )
}
