import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'
import { ProjectStatus, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams)

    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') as ProjectStatus | 'all' | null
    const userId = searchParams.get('userId') || undefined

    const where: Prisma.ProjectWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (userId) {
      where.userId = userId
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {}
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.ProjectOrderByWithRelationInput] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip: (page! - 1) * limit!,
        take: limit,
        select: {
          id: true,
          title: true,
          genre: true,
          status: true,
          currentEpisode: true,
          targetEpisodes: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: { episodes: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    return successResponse({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return serverErrorResponse()
  }
}
