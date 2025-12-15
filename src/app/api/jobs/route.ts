import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response'
import { AsyncJobStatus, AsyncJobType, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as AsyncJobStatus | null
    const jobType = searchParams.get('jobType') as AsyncJobType | null
    const userId = searchParams.get('userId')

    const where: Prisma.AsyncJobWhereInput = {}

    if (status) where.status = status
    if (jobType) where.jobType = jobType
    if (userId) where.userId = userId

    const [jobs, total] = await Promise.all([
      prisma.asyncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.asyncJob.count({ where }),
    ])

    return successResponse({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return serverErrorResponse()
  }
}
