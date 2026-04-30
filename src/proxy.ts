import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/compostov/login') return NextResponse.next()

  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_SECRET

  if (!secret || !token || token !== secret) {
    return NextResponse.redirect(new URL('/compostov/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/compostov/:path*'],
}
