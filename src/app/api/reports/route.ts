import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'
import { UserReportType, UserReportStatus, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams)

    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') as UserReportType | 'all' | null
    const status = searchParams.get('status') as UserReportStatus | 'all' | null

    const where: Prisma.UserReportWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // AIDEV-NOTE: 정렬 옵션 처리
    const orderBy: Prisma.UserReportOrderByWithRelationInput = {}
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        orderBy,
        skip: (page! - 1) * limit!,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.userReport.count({ where }),
    ])

    return successResponse({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch user reports:', error)
    return serverErrorResponse()
  }
}
