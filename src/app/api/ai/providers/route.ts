import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

// AIDEV-NOTE: AI 프로바이더 설정 목록 조회 API
export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const configs = await prisma.aiProviderConfig.findMany({
      orderBy: { feature: 'asc' },
    })

    return successResponse({ configs })
  } catch (error) {
    console.error('Failed to fetch provider configs:', error)
    return serverErrorResponse()
  }
}
