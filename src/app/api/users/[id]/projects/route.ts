import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
  getPaginationParams,
} from '@/lib/api/response'

export const dynamic = 'force-dynamic'

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
    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
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
          _count: {
            select: { episodes: true },
          },
        },
      }),
      prisma.project.count({ where: { userId: id } }),
    ])

    return successResponse({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch user projects:', error)
    return serverErrorResponse()
  }
}
