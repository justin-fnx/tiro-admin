import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'
import { CreditTransactionType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // 총 사용자 수
    const totalUsers = await prisma.user.count({
      where: { deletedAt: null },
    })

    // 어제 총 사용자 수 (증감 계산용)
    const yesterdayUsers = await prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { lt: today },
      },
    })

    // 오늘 가입자 수
    const todaySignups = await prisma.user.count({
      where: {
        createdAt: { gte: today },
        deletedAt: null,
      },
    })

    // 활성 프로젝트 수
    const activeProjects = await prisma.project.count({
      where: { status: 'ACTIVE' },
    })

    // 오늘 AI 사용량 (크레딧)
    const todayAiUsageResult = await prisma.creditTransaction.aggregate({
      where: {
        type: CreditTransactionType.USAGE,
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    })

    const todayAiUsage = Math.abs(todayAiUsageResult._sum.amount || 0)

    // 사용자 증감률
    const userGrowthPercent =
      yesterdayUsers > 0 ? ((totalUsers - yesterdayUsers) / yesterdayUsers) * 100 : 0

    return successResponse({
      totalUsers,
      todaySignups,
      activeProjects,
      todayAiUsage,
      userGrowthPercent: Math.round(userGrowthPercent * 10) / 10,
    })
  } catch (error) {
    console.error('Failed to fetch overview stats:', error)
    return serverErrorResponse()
  }
}
