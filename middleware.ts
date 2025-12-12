import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // SUPER_ADMIN 전용 페이지 체크
    const superAdminPaths = ['/settings/admins', '/settings/system']
    if (superAdminPaths.some((path) => pathname.startsWith(path))) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/projects/:path*',
    '/ai/:path*',
    '/credits/:path*',
    '/promotions/:path*',
    '/jobs/:path*',
    '/audit-logs/:path*',
    '/settings/:path*',
  ],
}
