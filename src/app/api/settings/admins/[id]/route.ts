import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/auth/session'
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'
import { AdminRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.adminWhitelist.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('관리자를 찾을 수 없습니다.')
    }

    // 자기 자신의 역할이나 활성화 상태 변경 방지
    if (existing.email === admin.email) {
      if (body.role !== undefined && body.role !== existing.role) {
        return badRequestResponse('자신의 역할을 변경할 수 없습니다.')
      }
      if (body.isActive !== undefined && body.isActive !== existing.isActive) {
        return badRequestResponse('자신의 활성화 상태를 변경할 수 없습니다.')
      }
    }

    const updated = await prisma.adminWhitelist.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        role: body.role !== undefined ? (body.role as AdminRole) : existing.role,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    })

    await logAdminActivity(admin.email, AdminActions.ADMIN_UPDATE, 'admin_whitelist', id, {
      before: { role: existing.role, isActive: existing.isActive },
      after: { role: updated.role, isActive: updated.isActive },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Failed to update admin:', error)
    return serverErrorResponse()
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const existing = await prisma.adminWhitelist.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('관리자를 찾을 수 없습니다.')
    }

    // 자기 자신 삭제 방지
    if (existing.email === admin.email) {
      return badRequestResponse('자기 자신을 삭제할 수 없습니다.')
    }

    await prisma.adminWhitelist.delete({
      where: { id },
    })

    await logAdminActivity(admin.email, AdminActions.ADMIN_DELETE, 'admin_whitelist', id, {
      email: existing.email,
    })

    return successResponse({ message: '삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete admin:', error)
    return serverErrorResponse()
  }
}
