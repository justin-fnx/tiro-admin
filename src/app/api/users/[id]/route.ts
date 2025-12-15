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

export const dynamic = 'force-dynamic'

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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        chargedCredit: true,
        dailyCredit: true,
        weeklyCredit: true,
        dailyCreditResetAt: true,
        weeklyCreditResetAt: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        deletedAt: true,
        _count: {
          select: { projects: true },
        },
      },
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    return successResponse(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
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

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        isEmailVerified: body.isEmailVerified,
      },
    })

    await logAdminActivity(admin.email, AdminActions.USER_UPDATE, 'user', id, {
      before: { name: existingUser.name, isEmailVerified: existingUser.isEmailVerified },
      after: { name: updatedUser.name, isEmailVerified: updatedUser.isEmailVerified },
    })

    return successResponse(updatedUser)
  } catch (error) {
    console.error('Failed to update user:', error)
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

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    if (existingUser.deletedAt) {
      return errorResponse('이미 삭제된 사용자입니다.')
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAdminActivity(admin.email, AdminActions.USER_DELETE, 'user', id, {
      email: existingUser.email,
    })

    return successResponse({ message: '사용자가 비활성화되었습니다.' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return serverErrorResponse()
  }
}
