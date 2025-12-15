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
import { AiFeature } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ feature: string }>
}

// AIDEV-NOTE: 개별 AI 프로바이더 설정 수정 API
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { feature } = await params
    const body = await request.json()

    // feature가 유효한 AiFeature enum 값인지 확인
    if (!Object.values(AiFeature).includes(feature as AiFeature)) {
      return errorResponse('유효하지 않은 기능입니다.')
    }

    const existingConfig = await prisma.aiProviderConfig.findUnique({
      where: { feature: feature as AiFeature },
    })

    if (!existingConfig) {
      return notFoundResponse('프로바이더 설정을 찾을 수 없습니다.')
    }

    const updatedConfig = await prisma.aiProviderConfig.update({
      where: { feature: feature as AiFeature },
      data: {
        provider: body.provider ?? existingConfig.provider,
        model: body.model ?? existingConfig.model,
        isActive: body.isActive ?? existingConfig.isActive,
      },
    })

    await logAdminActivity(admin.email, AdminActions.AI_PROVIDER_UPDATE, 'ai_provider_config', feature, {
      before: {
        provider: existingConfig.provider,
        model: existingConfig.model,
        isActive: existingConfig.isActive,
      },
      after: {
        provider: updatedConfig.provider,
        model: updatedConfig.model,
        isActive: updatedConfig.isActive,
      },
    })

    return successResponse(updatedConfig)
  } catch (error) {
    console.error('Failed to update provider config:', error)
    return serverErrorResponse()
  }
}
