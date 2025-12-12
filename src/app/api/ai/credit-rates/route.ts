import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const rates = await prisma.aiCreditRate.findMany({
      orderBy: [{ provider: 'asc' }, { model: 'asc' }],
    })

    // 프로바이더별로 그룹화
    const groupedRates = rates.reduce(
      (acc, rate) => {
        if (!acc[rate.provider]) {
          acc[rate.provider] = []
        }
        acc[rate.provider].push(rate)
        return acc
      },
      {} as Record<string, typeof rates>
    )

    return successResponse({ rates, groupedRates })
  } catch (error) {
    console.error('Failed to fetch credit rates:', error)
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
    const { provider, model, input, output } = body

    if (!provider || !model || input === undefined || output === undefined) {
      return errorResponse('필수 필드가 누락되었습니다.')
    }

    // 중복 체크
    const existing = await prisma.aiCreditRate.findUnique({
      where: { provider_model: { provider, model } },
    })

    if (existing) {
      return errorResponse('이미 존재하는 프로바이더/모델 조합입니다.')
    }

    const rate = await prisma.aiCreditRate.create({
      data: { provider, model, input, output },
    })

    await logAdminActivity(admin.email, AdminActions.AI_RATE_CREATE, 'ai_credit_rate', rate.id, {
      provider,
      model,
      input,
      output,
    })

    return successResponse(rate)
  } catch (error) {
    console.error('Failed to create credit rate:', error)
    return serverErrorResponse()
  }
}
