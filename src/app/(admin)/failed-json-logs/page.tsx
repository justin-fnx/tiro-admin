import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { FailedJsonLogDetailModal } from '@/components/features/failed-json-logs/FailedJsonLogDetailModal'
import { FailedJsonLogFilters } from '@/components/features/failed-json-logs/FailedJsonLogFilters'
import { DeleteFailedJsonLogButton } from '@/components/features/failed-json-logs/DeleteFailedJsonLogButton'
import { AlertTriangle, FileJson, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  search?: string
  userId?: string
  projectId?: string
  startDate?: string
  endDate?: string
  page?: string
}

async function getFailedJsonLogs(searchParams: SearchParams) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const limit = 20
  const search = searchParams.search || undefined
  const userId = searchParams.userId || undefined
  const projectId = searchParams.projectId || undefined
  const startDate = searchParams.startDate || undefined
  const endDate = searchParams.endDate || undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { userMessage: { contains: search, mode: 'insensitive' } },
      { rawJsonContent: { contains: search, mode: 'insensitive' } },
      { errorMessage: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { project: { title: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (userId) {
    where.userId = userId
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const [logs, total] = await Promise.all([
    prisma.failedJsonLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.failedJsonLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

async function getStats() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [total, todayCount, weekCount] = await Promise.all([
    prisma.failedJsonLog.count(),
    prisma.failedJsonLog.count({ where: { createdAt: { gte: today } } }),
    prisma.failedJsonLog.count({ where: { createdAt: { gte: weekAgo } } }),
  ])

  return { total, todayCount, weekCount }
}

export default async function FailedJsonLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [{ logs, total, page, totalPages }, stats] = await Promise.all([
    getFailedJsonLogs(params),
    getStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">JSON 파싱 실패 로그</h1>
        <p className="text-muted-foreground">
          LLM 응답 중 JSON 파싱에 실패한 내용을 조회하여 추후 개선에 반영합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 실패 건수</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 실패 건수</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 7일 실패 건수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.weekCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>실패 로그 목록</CardTitle>
          <CardDescription>총 {total}건의 실패 로그</CardDescription>
        </CardHeader>
        <CardContent>
          <FailedJsonLogFilters />

          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              실패 로그가 없습니다.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">생성일</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>프로젝트</TableHead>
                    <TableHead>에러 메시지</TableHead>
                    <TableHead>사용자 메시지</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${log.user.id}`}
                          className="text-sm hover:underline"
                        >
                          {log.user.name || log.user.email}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${log.project.id}`}
                          className="text-sm hover:underline max-w-[150px] truncate block"
                        >
                          {log.project.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {log.errorMessage ? (
                          <Badge variant="destructive" className="gap-1 max-w-[200px] truncate">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="truncate">{log.errorMessage}</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <span className="text-sm text-muted-foreground truncate block">
                          {log.userMessage.length > 50
                            ? log.userMessage.substring(0, 50) + '...'
                            : log.userMessage}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FailedJsonLogDetailModal
                            log={{
                              id: log.id,
                              projectId: log.projectId,
                              episodeId: log.episodeId,
                              userId: log.userId,
                              userMessage: log.userMessage,
                              rawJsonContent: log.rawJsonContent,
                              errorMessage: log.errorMessage,
                              context: log.context as Record<string, unknown> | null,
                              createdAt: log.createdAt.toISOString(),
                              user: log.user,
                              project: log.project,
                            }}
                          />
                          <DeleteFailedJsonLogButton logId={log.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Link
                        key={pageNum}
                        href={`/failed-json-logs?${new URLSearchParams({
                          ...params,
                          page: pageNum.toString(),
                        }).toString()}`}
                        className={`px-3 py-1 rounded ${
                          pageNum === page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                  {totalPages > 10 && (
                    <span className="text-muted-foreground">... {totalPages}</span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
