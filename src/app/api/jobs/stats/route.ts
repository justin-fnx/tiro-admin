import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'
import { AsyncJobStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [byStatus, todayCreated, todayCompleted, avgProcessingTime] = await Promise.all([
      prisma.asyncJob.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.asyncJob.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.asyncJob.count({
        where: {
          status: AsyncJobStatus.COMPLETED,
          completedAt: { gte: today },
        },
      }),
      prisma.$queryRaw<{ avg_seconds: number }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
        FROM async_jobs
        WHERE status = 'COMPLETED'
        AND completed_at IS NOT NULL
        AND created_at >= NOW() - INTERVAL '7 days'
      `,
    ])

    const statusCounts: Record<string, number> = {}
    for (const item of byStatus) {
      statusCounts[item.status] = item._count.status
    }

    return successResponse({
      byStatus: statusCounts,
      todayCreated,
      todayCompleted,
      avgProcessingTimeSeconds: avgProcessingTime[0]?.avg_seconds || 0,
    })
  } catch (error) {
    console.error('Failed to fetch job stats:', error)
    return serverErrorResponse()
  }
}
