import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { ProjectFilters } from '@/components/features/projects/ProjectFilters'
import { formatDate } from '@/lib/utils/format'
import { ProjectStatus, Prisma } from '@prisma/client'
import { Eye, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    sort?: string
  }>
}

const statusColors: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  ACTIVE: 'success',
  COMPLETED: 'default',
  ARCHIVED: 'secondary',
  DELETED: 'destructive',
}

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: '활성',
  COMPLETED: '완료',
  ARCHIVED: '보관',
  DELETED: '삭제',
}

// AIDEV-NOTE: 정렬 옵션 파싱 - sort 파라미터는 "field:direction" 형식 (예: "createdAt:desc")
function parseSortParam(sort?: string): Prisma.ProjectOrderByWithRelationInput {
  if (!sort) return { createdAt: 'desc' }

  const [field, direction] = sort.split(':')
  const order = direction === 'asc' ? 'asc' : 'desc'

  switch (field) {
    case 'title':
      return { title: order }
    case 'updatedAt':
      return { updatedAt: order }
    case 'episodes':
      return { episodes: { _count: order } }
    case 'createdAt':
    default:
      return { createdAt: order }
  }
}

async function getProjects(searchParams: Awaited<PageProps['searchParams']>) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const limit = 20

  const where: Prisma.ProjectWhereInput = {}

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
      { user: { name: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status as ProjectStatus
  }

  const orderBy = parseSortParam(searchParams.sort)

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        genre: true,
        status: true,
        currentEpisode: true,
        targetEpisodes: true,
        createdAt: true,
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

  return {
    projects,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { projects, total, page, totalPages } = await getProjects(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">프로젝트 관리</h1>
        <p className="text-muted-foreground">전체 {total}개의 프로젝트</p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <ProjectFilters />
      </Suspense>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>장르</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>회차</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  프로젝트가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell>{project.genre || '-'}</TableCell>
                  <TableCell>
                    <Link href={`/users/${project.user.id}`} className="hover:underline">
                      {project.user.name || project.user.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {project._count.episodes}
                    {project.targetEpisodes ? ` / ${project.targetEpisodes}` : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(project.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            상세 보기
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/projects" />
    </div>
  )
}
