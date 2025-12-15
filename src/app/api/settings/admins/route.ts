import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/auth/session'
import {
  successResponse,
  badRequestResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'
import { AdminRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = await requireSuperAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const admins = await prisma.adminWhitelist.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(admins)
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { email, name, role } = body

    if (!email) {
      return badRequestResponse('이메일은 필수입니다.')
    }

    const existing = await prisma.adminWhitelist.findUnique({
      where: { email },
    })

    if (existing) {
      return badRequestResponse('이미 등록된 관리자입니다.')
    }

    const newAdmin = await prisma.adminWhitelist.create({
      data: {
        email,
        name: name || null,
        role: role || AdminRole.ADMIN,
        isActive: true,
      },
    })

    await logAdminActivity(admin.email, AdminActions.ADMIN_CREATE, 'admin_whitelist', newAdmin.id, {
      email: newAdmin.email,
      role: newAdmin.role,
    })

    return successResponse(newAdmin)
  } catch (error) {
    console.error('Failed to create admin:', error)
    return serverErrorResponse()
  }
}
