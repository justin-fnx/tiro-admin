import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // API 요청인 경우
    if (pathname.startsWith('/api/')) {
      // 인증 관련 API는 통과
      if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next()
      }

      // 토큰이 없으면 401 반환
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized', message: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
    }

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
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // API 요청은 미들웨어 함수에서 처리
        if (pathname.startsWith('/api/')) {
          return true
        }

        // 페이지 요청은 토큰 필수
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    // 페이지 경로
    '/dashboard/:path*',
    '/users/:path*',
    '/projects/:path*',
    '/ai/:path*',
    '/credits/:path*',
    '/promotions/:path*',
    '/jobs/:path*',
    '/audit-logs/:path*',
    '/settings/:path*',
    '/reports/:path*',
    // API 경로 (auth 제외)
    '/api/((?!auth).*)',
  ],
}
