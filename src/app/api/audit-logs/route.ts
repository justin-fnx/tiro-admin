import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const adminEmail = searchParams.get('adminEmail')
    const targetType = searchParams.get('targetType')

    const where: {
      action?: string
      adminEmail?: { contains: string; mode: 'insensitive' }
      targetType?: string
    } = {}

    if (action) where.action = action
    if (adminEmail) where.adminEmail = { contains: adminEmail, mode: 'insensitive' }
    if (targetType) where.targetType = targetType

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminActivityLog.count({ where }),
    ])

    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return serverErrorResponse()
  }
}
