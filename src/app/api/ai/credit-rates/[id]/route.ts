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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const existingRate = await prisma.aiCreditRate.findUnique({
      where: { id },
    })

    if (!existingRate) {
      return notFoundResponse('크레딧 비율을 찾을 수 없습니다.')
    }

    const updatedRate = await prisma.aiCreditRate.update({
      where: { id },
      data: {
        input: body.input ?? existingRate.input,
        output: body.output ?? existingRate.output,
        isActive: body.isActive ?? existingRate.isActive,
      },
    })

    await logAdminActivity(admin.email, AdminActions.AI_RATE_UPDATE, 'ai_credit_rate', id, {
      before: { input: existingRate.input, output: existingRate.output, isActive: existingRate.isActive },
      after: { input: updatedRate.input, output: updatedRate.output, isActive: updatedRate.isActive },
    })

    return successResponse(updatedRate)
  } catch (error) {
    console.error('Failed to update credit rate:', error)
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

    const existingRate = await prisma.aiCreditRate.findUnique({
      where: { id },
    })

    if (!existingRate) {
      return notFoundResponse('크레딧 비율을 찾을 수 없습니다.')
    }

    // 실제 삭제 대신 비활성화
    await prisma.aiCreditRate.update({
      where: { id },
      data: { isActive: false },
    })

    await logAdminActivity(admin.email, AdminActions.AI_RATE_UPDATE, 'ai_credit_rate', id, {
      action: 'deactivate',
      provider: existingRate.provider,
      model: existingRate.model,
    })

    return successResponse({ message: '비활성화되었습니다.' })
  } catch (error) {
    console.error('Failed to deactivate credit rate:', error)
    return serverErrorResponse()
  }
}
