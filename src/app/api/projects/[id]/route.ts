import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'
import { logAdminActivity, AdminActions } from '@/lib/utils/admin-logger'
import { ProjectStatus } from '@prisma/client'

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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { episodes: true },
        },
      },
    })

    if (!project) {
      return notFoundResponse('프로젝트를 찾을 수 없습니다.')
    }

    return successResponse(project)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return serverErrorResponse()
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()

    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return notFoundResponse('프로젝트를 찾을 수 없습니다.')
    }

    const { status } = body as { status: ProjectStatus }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status },
    })

    await logAdminActivity(admin.email, AdminActions.PROJECT_UPDATE, 'project', id, {
      before: { status: existingProject.status },
      after: { status: updatedProject.status },
    })

    return successResponse(updatedProject)
  } catch (error) {
    console.error('Failed to update project:', error)
    return serverErrorResponse()
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return notFoundResponse('프로젝트를 찾을 수 없습니다.')
    }

    if (existingProject.status === ProjectStatus.DELETED) {
      return errorResponse('이미 삭제된 프로젝트입니다.')
    }

    await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.DELETED },
    })

    await logAdminActivity(admin.email, AdminActions.PROJECT_DELETE, 'project', id, {
      title: existingProject.title,
    })

    return successResponse({ message: '프로젝트가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return serverErrorResponse()
  }
}
