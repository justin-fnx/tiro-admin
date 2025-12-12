import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'
import { SubscriptionTier } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const { subscriptionTier, subscriptionExpiry, reason } = body as {
      subscriptionTier: SubscriptionTier
      subscriptionExpiry?: string | null
      reason: string
    }

    if (!subscriptionTier || !reason) {
      return errorResponse('필수 필드가 누락되었습니다.')
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        subscriptionTier,
        subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : null,
      },
    })

    await logAdminActivity(admin.email, AdminActions.USER_PLAN_CHANGE, 'user', id, {
      before: {
        subscriptionTier: user.subscriptionTier,
        subscriptionExpiry: user.subscriptionExpiry,
      },
      after: {
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionExpiry: updatedUser.subscriptionExpiry,
      },
      reason,
    })

    return successResponse({
      message: '구독 플랜이 변경되었습니다.',
      user: {
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionExpiry: updatedUser.subscriptionExpiry,
      },
    })
  } catch (error) {
    console.error('Failed to change plan:', error)
    return serverErrorResponse()
  }
}
