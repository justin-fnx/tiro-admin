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

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return notFoundResponse('프로젝트를 찾을 수 없습니다.')
    }

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where: { projectId: id },
        orderBy: { episodeNumber: 'asc' },
        skip: (page! - 1) * limit!,
        take: limit,
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          status: true,
          wordCount: true,
          creditsUsed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.episode.count({ where: { projectId: id } }),
    ])

    return successResponse({
      episodes,
      total,
      page,
      totalPages: Math.ceil(total / limit!),
    })
  } catch (error) {
    console.error('Failed to fetch episodes:', error)
    return serverErrorResponse()
  }
}
