import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { getSession } from '@/lib/auth/session'

// Force dynamic rendering for all admin pages (they require database access)
export const dynamic = 'force-dynamic'

// AIDEV-NOTE: 모든 admin 페이지에 대해 서버 사이드에서 세션 검증
// 이렇게 하지 않으면 서버 컴포넌트에서 Prisma를 직접 호출할 때 인증 없이 데이터를 가져올 수 있음
// 미들웨어가 callbackUrl과 함께 리다이렉트를 처리하지만, 이 체크는 추가 보안 레이어 역할을 함
export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    // 미들웨어가 대부분의 경우 callbackUrl과 함께 리다이렉트를 처리함
    // 이 fallback redirect는 미들웨어를 우회하는 경우를 대비한 것
    redirect('/login')
  }

  return <AdminLayout>{children}</AdminLayout>
}
