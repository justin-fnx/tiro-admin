import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'

interface RouteParams {
  params: Promise<{ episodeId: string }>
}

// AIDEV-NOTE: 에피소드 상세 조회 API - 리비전 목록과 대화 이력을 함께 반환
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { episodeId } = await params

    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        project: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
        activeRevision: {
          select: {
            id: true,
            version: true,
            content: true,
            wordCount: true,
            createdAt: true,
          },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            version: true,
            content: true,
            changeDescription: true,
            wordCount: true,
            createdAt: true,
            creditsUsed: true,
            parentRevisionId: true,
          },
        },
      },
    })

    if (!episode) {
      return notFoundResponse('에피소드를 찾을 수 없습니다.')
    }

    // 각 리비전에 대한 대화 이력 조회
    const revisionIds = episode.revisions.map((r) => r.id)
    const chatMessages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { episodeId: episodeId },
          { revisionId: { in: revisionIds } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        episodeId: true,
        revisionId: true,
        role: true,
        content: true,
        turnNumber: true,
        createdAt: true,
      },
    })

    // 리비전별로 대화 이력 그룹화
    const revisionsWithMessages = episode.revisions.map((revision) => ({
      ...revision,
      chatMessages: chatMessages.filter(
        (msg) => msg.revisionId === revision.id ||
          (msg.episodeId === episodeId && !msg.revisionId)
      ),
    }))

    return successResponse({
      ...episode,
      revisions: revisionsWithMessages,
      chatMessages: chatMessages.filter((msg) => !msg.revisionId),
    })
  } catch (error) {
    console.error('Failed to fetch episode details:', error)
    return serverErrorResponse()
  }
}
