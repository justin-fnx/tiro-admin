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
import { CreditTransactionType, CreditType } from '@prisma/client'

export const dynamic = 'force-dynamic'

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

    const { amount, creditType, reason } = body as {
      amount: number
      creditType: 'chargedCredit' | 'dailyCredit' | 'weeklyCredit'
      reason: string
    }

    if (!amount || !creditType || !reason) {
      return errorResponse('필수 필드가 누락되었습니다.')
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    // 크레딧 타입에 따른 필드 업데이트
    const updateData: Record<string, number> = {}
    let transactionCreditType: CreditType | null = null

    switch (creditType) {
      case 'chargedCredit':
        updateData.chargedCredit = user.chargedCredit + amount
        transactionCreditType = CreditType.CHARGED
        break
      case 'dailyCredit':
        updateData.dailyCredit = user.dailyCredit + amount
        transactionCreditType = CreditType.SUBSCRIPTION
        break
      case 'weeklyCredit':
        updateData.weeklyCredit = user.weeklyCredit + amount
        transactionCreditType = CreditType.SUBSCRIPTION
        break
    }

    // 트랜잭션으로 사용자 업데이트 및 거래 내역 생성
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: updateData,
      }),
      prisma.creditTransaction.create({
        data: {
          userId: id,
          amount,
          type: amount > 0 ? CreditTransactionType.BONUS : CreditTransactionType.USAGE,
          creditType: transactionCreditType,
          description: `[관리자] ${reason}`,
          metadata: {
            adjustedBy: admin.email,
            creditType,
          },
        },
      }),
    ])

    await logAdminActivity(admin.email, AdminActions.USER_CREDIT_ADJUST, 'user', id, {
      before: {
        [creditType]: user[creditType as keyof typeof user],
      },
      after: {
        [creditType]: updatedUser[creditType as keyof typeof updatedUser],
      },
      amount,
      reason,
    })

    return successResponse({
      message: '크레딧이 조정되었습니다.',
      user: {
        chargedCredit: updatedUser.chargedCredit,
        dailyCredit: updatedUser.dailyCredit,
        weeklyCredit: updatedUser.weeklyCredit,
      },
    })
  } catch (error) {
    console.error('Failed to adjust credits:', error)
    return serverErrorResponse()
  }
}
