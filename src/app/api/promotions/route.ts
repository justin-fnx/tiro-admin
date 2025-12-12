import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'
import { PromotionCodeType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') as PromotionCodeType | 'all' | null
    const isActive = searchParams.get('isActive')

    const where: Prisma.PromotionCodeWhereInput = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (isActive === 'true') {
      where.isActive = true
    } else if (isActive === 'false') {
      where.isActive = false
    }

    const [promotionCodes, total] = await Promise.all([
      prisma.promotionCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page! - 1) * limit!,
        take: limit,
      }),
      prisma.promotionCode.count({ where }),
    ])

    return successResponse({
      promotionCodes,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch promotion codes:', error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { code, type, creditAmount, quota, description, expiresAt } = body

    if (!code || !type || !creditAmount) {
      return errorResponse('필수 필드가 누락되었습니다.')
    }

    // 중복 체크
    const existing = await prisma.promotionCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return errorResponse('이미 존재하는 코드입니다.')
    }

    const promotionCode = await prisma.promotionCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        creditAmount,
        quota: quota || null,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    await logAdminActivity(admin.email, AdminActions.PROMOTION_CREATE, 'promotion_code', promotionCode.id, {
      code: promotionCode.code,
      type: promotionCode.type,
      creditAmount: promotionCode.creditAmount,
    })

    return successResponse(promotionCode)
  } catch (error) {
    console.error('Failed to create promotion code:', error)
    return serverErrorResponse()
  }
}
