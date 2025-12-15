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
import { UserReportStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// AIDEV-NOTE: 단일 피드백 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const report = await prisma.userReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            subscriptionTier: true,
            createdAt: true,
          },
        },
      },
    })

    if (!report) {
      return notFoundResponse('피드백을 찾을 수 없습니다.')
    }

    await logAdminActivity(admin.email, AdminActions.REPORT_VIEW, 'user_report', id, {
      title: report.title,
      type: report.type,
    })

    return successResponse(report)
  } catch (error) {
    console.error('Failed to fetch user report:', error)
    return serverErrorResponse()
  }
}

// AIDEV-NOTE: 피드백 수정 (상태 변경, 관리자 메모 등)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const { status, adminNote } = body

    const existingReport = await prisma.userReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return notFoundResponse('피드백을 찾을 수 없습니다.')
    }

    // 유효한 상태값인지 확인
    if (status && !Object.values(UserReportStatus).includes(status)) {
      return errorResponse('유효하지 않은 상태값입니다.')
    }

    const updateData: { status?: UserReportStatus; adminNote?: string } = {}
    if (status) updateData.status = status
    if (adminNote !== undefined) updateData.adminNote = adminNote

    const report = await prisma.userReport.update({
      where: { id },
      data: updateData,
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
    })

    await logAdminActivity(admin.email, AdminActions.REPORT_UPDATE, 'user_report', id, {
      title: report.title,
      previousStatus: existingReport.status,
      newStatus: status || existingReport.status,
      adminNote: adminNote || undefined,
    })

    return successResponse(report)
  } catch (error) {
    console.error('Failed to update user report:', error)
    return serverErrorResponse()
  }
}

// AIDEV-NOTE: 피드백 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const existingReport = await prisma.userReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return notFoundResponse('피드백을 찾을 수 없습니다.')
    }

    await prisma.userReport.delete({
      where: { id },
    })

    await logAdminActivity(admin.email, AdminActions.REPORT_DELETE, 'user_report', id, {
      title: existingReport.title,
      type: existingReport.type,
    })

    return successResponse({ success: true })
  } catch (error) {
    console.error('Failed to delete user report:', error)
    return serverErrorResponse()
  }
}
