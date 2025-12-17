import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const log = await prisma.failedJsonLog.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!log) {
      return notFoundResponse('로그를 찾을 수 없습니다.')
    }

    return successResponse(log)
  } catch (error) {
    console.error('Failed to fetch failed json log:', error)
    return serverErrorResponse()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const log = await prisma.failedJsonLog.findUnique({
      where: { id: params.id },
    })

    if (!log) {
      return notFoundResponse('로그를 찾을 수 없습니다.')
    }

    await prisma.failedJsonLog.delete({
      where: { id: params.id },
    })

    return successResponse({ message: '삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete failed json log:', error)
    return serverErrorResponse()
  }
}
