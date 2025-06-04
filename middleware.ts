import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If we're on the login page and have a session, redirect to home
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If we don't have a session and we're not on an auth page, redirect to login
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}