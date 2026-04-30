import { NextRequest, NextResponse } from 'next/server'

// Searches Sooplive public broadcast list for a specific broadcaster
export async function GET(req: NextRequest) {
  const bjid = req.nextUrl.searchParams.get('bjid')
  if (!bjid) return NextResponse.json({ error: 'bjid required' }, { status: 400 })

  const clientId = process.env.SOOP_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'SOOP_CLIENT_ID not configured' }, { status: 500 })

  for (let page = 1; page <= 5; page++) {
    const url = new URL('https://openapi.sooplive.com/broad/list')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('order_type', 'view_cnt')
    url.searchParams.set('page_no', String(page))

    let data: { data?: BroadcastEntry[]; result?: BroadcastEntry[] }
    try {
      const res = await fetch(url.toString(), { next: { revalidate: 30 } })
      data = await res.json()
    } catch {
      break
    }

    const broadcasts: BroadcastEntry[] = data?.data ?? data?.result ?? []
    if (!Array.isArray(broadcasts) || broadcasts.length === 0) break

    const found = broadcasts.find(
      b => b.user_id === bjid || b.bjid === bjid || b.broad_bj_id === bjid
    )

    if (found) {
      return NextResponse.json({
        broad_no: found.broad_no ?? found.broad_num,
        title: found.broad_title,
      })
    }

    if (broadcasts.length < 60) break
  }

  return NextResponse.json({ error: 'Broadcaster not live' }, { status: 404 })
}

type BroadcastEntry = {
  user_id?: string
  bjid?: string
  broad_bj_id?: string
  broad_no?: string
  broad_num?: string
  broad_title?: string
}
