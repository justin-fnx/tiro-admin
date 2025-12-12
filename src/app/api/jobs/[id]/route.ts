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
import { AsyncJobStatus } from '@prisma/client'

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

    const job = await prisma.asyncJob.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        project: {
          select: { id: true, title: true },
        },
        episode: {
          select: { id: true, title: true, episodeNumber: true },
        },
      },
    })

    if (!job) {
      return notFoundResponse('작업을 찾을 수 없습니다.')
    }

    return successResponse(job)
  } catch (error) {
    console.error('Failed to fetch job:', error)
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

    const existing = await prisma.asyncJob.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('작업을 찾을 수 없습니다.')
    }

    const updateData: { status?: AsyncJobStatus; errorMessage?: string | null } = {}

    if (body.status) {
      updateData.status = body.status as AsyncJobStatus
    }
    if (body.errorMessage !== undefined) {
      updateData.errorMessage = body.errorMessage
    }

    const updated = await prisma.asyncJob.update({
      where: { id },
      data: updateData,
    })

    await logAdminActivity(admin.email, AdminActions.JOB_UPDATE, 'async_job', id, {
      before: { status: existing.status },
      after: { status: updated.status },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Failed to update job:', error)
    return serverErrorResponse()
  }
}
