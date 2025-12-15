import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'
import { SubscriptionTier, Prisma } from '@prisma/client'

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
    const subscriptionTier = searchParams.get('subscriptionTier') as SubscriptionTier | 'all' | null
    const status = searchParams.get('status') as 'active' | 'deleted' | 'all' | null

    // Where 조건 구성
    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (subscriptionTier && subscriptionTier !== 'all') {
      where.subscriptionTier = subscriptionTier
    }

    if (status === 'active') {
      where.deletedAt = null
    } else if (status === 'deleted') {
      where.deletedAt = { not: null }
    }

    // 정렬 조건
    const orderBy: Prisma.UserOrderByWithRelationInput = {}
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page! - 1) * limit!,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          chargedCredit: true,
          dailyCredit: true,
          weeklyCredit: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          deletedAt: true,
          _count: {
            select: { projects: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return successResponse({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return serverErrorResponse()
  }
}
