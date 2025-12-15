import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'
import { CreditTransactionType } from '@prisma/client'
import { format, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const sevenDaysAgo = subDays(today, 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // 7일간의 날짜 배열 생성
    const dates: Date[] = []
    for (let i = 6; i >= 0; i--) {
      dates.push(subDays(today, i))
    }

    // 일별 가입자 수
    const signupsData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo, lte: today },
        deletedAt: null,
      },
      _count: true,
    })

    // 일별 AI 사용량
    const usageData = await prisma.creditTransaction.groupBy({
      by: ['createdAt'],
      where: {
        type: CreditTransactionType.USAGE,
        createdAt: { gte: sevenDaysAgo, lte: today },
      },
      _sum: { amount: true },
    })

    // 날짜별로 데이터 정리
    const result = dates.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // 해당 날짜의 가입자 수 계산
      const signups = signupsData.filter((s) => {
        const created = new Date(s.createdAt)
        return created >= dayStart && created <= dayEnd
      }).length

      // 해당 날짜의 AI 사용량 계산
      const usage = usageData
        .filter((u) => {
          const created = new Date(u.createdAt)
          return created >= dayStart && created <= dayEnd
        })
        .reduce((sum, u) => sum + Math.abs(u._sum.amount || 0), 0)

      return {
        date: dateStr,
        signups,
        aiUsage: usage,
      }
    })

    return successResponse(result)
  } catch (error) {
    console.error('Failed to fetch usage stats:', error)
    return serverErrorResponse()
  }
}
