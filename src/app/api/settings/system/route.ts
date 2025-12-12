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

export async function GET() {
  try {
    const admin = await requireSuperAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return successResponse(settings)
  } catch (error) {
    console.error('Failed to fetch system settings:', error)
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
    const { key, value, description } = body

    if (!key || value === undefined) {
      return badRequestResponse('키와 값은 필수입니다.')
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: description || null,
        updatedBy: admin.email,
      },
      create: {
        key,
        value,
        description: description || null,
        updatedBy: admin.email,
      },
    })

    await logAdminActivity(admin.email, AdminActions.SETTING_UPDATE, 'system_setting', key, {
      value,
    })

    return successResponse(setting)
  } catch (error) {
    console.error('Failed to update system setting:', error)
    return serverErrorResponse()
  }
}
