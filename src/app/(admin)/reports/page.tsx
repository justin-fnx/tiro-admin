import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { ReportDetailModal } from '@/components/features/reports/ReportDetailModal'
import { ReportFilters } from '@/components/features/reports/ReportFilters'
import { DeleteReportButton } from '@/components/features/reports/DeleteReportButton'
import { MessageSquare, Bug, HelpCircle, Lightbulb, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { UserReportType, UserReportStatus } from '@prisma/client'
import Link from 'next/link'

interface SearchParams {
  search?: string
  type?: string
  status?: string
  page?: string
}

async function getReports(searchParams: SearchParams) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const limit = 20
  const search = searchParams.search || undefined
  const type = searchParams.type as UserReportType | 'all' | undefined
  const status = searchParams.status as UserReportStatus | 'all' | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (type && type !== 'all') {
    where.type = type
  }

  if (status && status !== 'all') {
    where.status = status
  }

  const [reports, total] = await Promise.all([
    prisma.userReport.findMany({
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
            avatar: true,
          },
        },
      },
    }),
    prisma.userReport.count({ where }),
  ])

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

async function getReportStats() {
  const [total, pending, inProgress, resolved] = await Promise.all([
    prisma.userReport.count(),
    prisma.userReport.count({ where: { status: 'PENDING' } }),
    prisma.userReport.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.userReport.count({ where: { status: 'RESOLVED' } }),
  ])

  return { total, pending, inProgress, resolved }
}

// AIDEV-NOTE: 피드백 유형별 아이콘 및 라벨 매핑
function getTypeInfo(type: UserReportType): { icon: React.ElementType; label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' } {
  switch (type) {
    case 'BUG':
      return { icon: Bug, label: '버그', variant: 'destructive' }
    case 'QUESTION':
      return { icon: HelpCircle, label: '질문', variant: 'secondary' }
    case 'FEATURE':
      return { icon: Lightbulb, label: '기능 요청', variant: 'outline' }
    case 'OTHER':
    default:
      return { icon: MessageSquare, label: '기타', variant: 'default' }
  }
}

// AIDEV-NOTE: 피드백 상태별 아이콘 및 라벨 매핑
function getStatusInfo(status: UserReportStatus): { icon: React.ElementType; label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' } {
  switch (status) {
    case 'PENDING':
      return { icon: Clock, label: '대기 중', variant: 'outline' }
    case 'IN_PROGRESS':
      return { icon: Loader2, label: '처리 중', variant: 'secondary' }
    case 'RESOLVED':
      return { icon: CheckCircle, label: '해결됨', variant: 'success' }
    case 'CLOSED':
      return { icon: XCircle, label: '닫힘', variant: 'default' }
    default:
      return { icon: Clock, label: status, variant: 'default' }
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [{ reports, total, page, totalPages }, stats] = await Promise.all([
    getReports(params),
    getReportStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">피드백 관리</h1>
        <p className="text-muted-foreground">사용자 피드백 및 버그 리포트를 관리합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 피드백</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처리 중</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">해결됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>피드백 목록</CardTitle>
          <CardDescription>총 {total}개의 피드백</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters />

          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              피드백이 없습니다.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유형</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const typeInfo = getTypeInfo(report.type)
                    const statusInfo = getStatusInfo(report.status)
                    const TypeIcon = typeInfo.icon
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant={typeInfo.variant} className="gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant as 'default' | 'destructive' | 'outline' | 'secondary'}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate font-medium">
                          {report.title}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/users/${report.user.id}`}
                            className="text-sm hover:underline"
                          >
                            {report.user.name || report.user.email}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ReportDetailModal
                              report={{
                                id: report.id,
                                type: report.type,
                                status: report.status,
                                title: report.title,
                                content: report.content,
                                pageUrl: report.pageUrl,
                                userAgent: report.userAgent,
                                metadata: report.metadata as Record<string, unknown>,
                                adminNote: report.adminNote,
                                createdAt: report.createdAt.toISOString(),
                                updatedAt: report.updatedAt.toISOString(),
                                user: report.user,
                              }}
                            />
                            <DeleteReportButton reportId={report.id} title={report.title} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/reports?${new URLSearchParams({
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
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
