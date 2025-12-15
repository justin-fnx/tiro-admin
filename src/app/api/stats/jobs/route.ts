import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    // 상태별 작업 수
    const jobStats = await prisma.asyncJob.groupBy({
      by: ['status'],
      _count: true,
    })

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }

    jobStats.forEach((stat) => {
      const key = stat.status.toLowerCase() as keyof typeof stats
      stats[key] = stat._count
    })

    return successResponse(stats)
  } catch (error) {
    console.error('Failed to fetch job stats:', error)
    return serverErrorResponse()
  }
}
