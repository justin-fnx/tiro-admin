import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page! - 1) * limit!,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          creditType: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.creditTransaction.count({ where: { userId: id } }),
    ])

    return successResponse({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch user transactions:', error)
    return serverErrorResponse()
  }
}
