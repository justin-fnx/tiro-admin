import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'
import { CreditTransactionType, CreditType, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    // 필터 파라미터
    const type = searchParams.get('type')
    const creditType = searchParams.get('creditType')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // where 조건 생성
    const where: Prisma.CreditTransactionWhereInput = {}

    if (type && type !== 'all') {
      where.type = type as CreditTransactionType
    }

    if (creditType && creditType !== 'all') {
      where.creditType = creditType as CreditType
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate) {
      where.createdAt = {
        ...((where.createdAt as Prisma.DateTimeFilter) || {}),
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = {
        ...((where.createdAt as Prisma.DateTimeFilter) || {}),
        lte: end,
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page! - 1) * limit!,
        take: limit,
        select: {
          id: true,
          userId: true,
          amount: true,
          type: true,
          creditType: true,
          description: true,
          paymentId: true,
          paymentMethod: true,
          priceKRW: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.creditTransaction.count({ where }),
    ])

    return successResponse({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return serverErrorResponse()
  }
}
