import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'

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

    const promotionCode = await prisma.promotionCode.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    })

    if (!promotionCode) {
      return notFoundResponse('프로모션 코드를 찾을 수 없습니다.')
    }

    return successResponse(promotionCode)
  } catch (error) {
    console.error('Failed to fetch promotion code:', error)
    return serverErrorResponse()
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.promotionCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('프로모션 코드를 찾을 수 없습니다.')
    }

    const updated = await prisma.promotionCode.update({
      where: { id },
      data: {
        creditAmount: body.creditAmount ?? existing.creditAmount,
        quota: body.quota !== undefined ? body.quota : existing.quota,
        description: body.description !== undefined ? body.description : existing.description,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt,
        isActive: body.isActive ?? existing.isActive,
      },
    })

    await logAdminActivity(admin.email, AdminActions.PROMOTION_UPDATE, 'promotion_code', id, {
      before: existing,
      after: updated,
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Failed to update promotion code:', error)
    return serverErrorResponse()
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const existing = await prisma.promotionCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('프로모션 코드를 찾을 수 없습니다.')
    }

    await prisma.promotionCode.delete({
      where: { id },
    })

    await logAdminActivity(admin.email, AdminActions.PROMOTION_DELETE, 'promotion_code', id, {
      code: existing.code,
    })

    return successResponse({ message: '삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete promotion code:', error)
    return serverErrorResponse()
  }
}
