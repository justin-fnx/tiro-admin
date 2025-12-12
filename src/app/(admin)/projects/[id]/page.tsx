import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { ArrowLeft, User, BookOpen, FileText, Zap } from 'lucide-react'
import { ProjectStatus, EpisodeStatus } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string }>
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

const episodeStatusLabels: Record<EpisodeStatus, string> = {
  DRAFT: '초안',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  PUBLISHED: '발행',
  ARCHIVED: '보관',
}

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
      episodes: {
        orderBy: { episodeNumber: 'asc' },
        take: 50,
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          status: true,
          wordCount: true,
          creditsUsed: true,
          createdAt: true,
        },
      },
      _count: {
        select: { episodes: true },
      },
    },
  })
}

async function getProjectStats(id: string) {
  const result = await prisma.episode.aggregate({
    where: { projectId: id },
    _sum: { wordCount: true, creditsUsed: true },
  })
  return {
    totalWordCount: result._sum.wordCount || 0,
    totalCreditsUsed: result._sum.creditsUsed || 0,
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const [project, stats] = await Promise.all([getProject(id), getProjectStats(id)])

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground">{project.genre || '장르 미지정'}</p>
        </div>
        <Badge variant={statusColors[project.status]} className="text-sm">
          {statusLabels[project.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">작성자</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href={`/users/${project.user.id}`} className="text-lg font-bold hover:underline">
              {project.user.name || project.user.email}
            </Link>
            <p className="text-xs text-muted-foreground">{project.user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">회차</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project._count.episodes}
              {project.targetEpisodes ? ` / ${project.targetEpisodes}` : ''}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.targetEpisodes
                ? `목표 대비 ${Math.round((project._count.episodes / project.targetEpisodes) * 100)}%`
                : '목표 미설정'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 글자 수</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalWordCount)}</div>
            <p className="text-xs text-muted-foreground">
              회차당 평균{' '}
              {project._count.episodes > 0
                ? formatNumber(Math.round(stats.totalWordCount / project._count.episodes))
                : 0}
              자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 크레딧 사용</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCreditsUsed)}</div>
            <p className="text-xs text-muted-foreground">AI 생성에 사용된 크레딧</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">설명</p>
            <p>{project.description || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">문체</p>
            <p>{project.writingStyle || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">생성일</p>
            <p>{formatDate(project.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">최근 수정일</p>
            <p>{formatDate(project.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>회차 목록</CardTitle>
          <CardDescription>총 {project._count.episodes}개 회차</CardDescription>
        </CardHeader>
        <CardContent>
          {project.episodes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">회차가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회차</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">글자 수</TableHead>
                  <TableHead className="text-right">크레딧</TableHead>
                  <TableHead>생성일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.episodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell className="font-medium">{episode.episodeNumber}화</TableCell>
                    <TableCell>{episode.title || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{episodeStatusLabels[episode.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(episode.wordCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(episode.creditsUsed)}</TableCell>
                    <TableCell>{formatDate(episode.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
