import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { Activity, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { AsyncJobStatus } from '@prisma/client'
import Link from 'next/link'

const statusColors: Record<AsyncJobStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  PENDING: 'outline',
  PROCESSING: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'outline',
}

const statusLabels: Record<AsyncJobStatus, string> = {
  PENDING: '대기중',
  PROCESSING: '처리중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소됨',
}

const jobTypeLabels: Record<string, string> = {
  EPISODE_GENERATION: '에피소드 생성',
  EPISODE_REVISION: '에피소드 수정',
  BATCH_GENERATION: '일괄 생성',
  CONTENT_ANALYSIS: '콘텐츠 분석',
}

async function getJobStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [byStatus, todayCreated, todayCompleted] = await Promise.all([
    prisma.asyncJob.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.asyncJob.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.asyncJob.count({
      where: {
        status: AsyncJobStatus.COMPLETED,
        completedAt: { gte: today },
      },
    }),
  ])

  const statusCounts: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
    CANCELLED: 0,
  }
  for (const item of byStatus) {
    statusCounts[item.status] = item._count.status
  }

  return { statusCounts, todayCreated, todayCompleted }
}

async function getJobs(status?: AsyncJobStatus) {
  return prisma.asyncJob.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
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
  })
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '-'
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}분 ${remainingSeconds}초`
}

export default async function JobsPage() {
  const [stats, allJobs, pendingJobs, processingJobs, failedJobs] = await Promise.all([
    getJobStats(),
    getJobs(),
    getJobs(AsyncJobStatus.PENDING),
    getJobs(AsyncJobStatus.PROCESSING),
    getJobs(AsyncJobStatus.FAILED),
  ])

  const JobTable = ({ jobs }: { jobs: typeof allJobs }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>유형</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>사용자</TableHead>
          <TableHead>프로젝트</TableHead>
          <TableHead>에피소드</TableHead>
          <TableHead>소요시간</TableHead>
          <TableHead>생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              작업이 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">
                {jobTypeLabels[job.jobType] || job.jobType}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[job.status]}>{statusLabels[job.status]}</Badge>
              </TableCell>
              <TableCell>
                {job.user ? (
                  <Link href={`/users/${job.user.id}`} className="hover:underline">
                    {job.user.name || job.user.email}
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {job.project ? (
                  <Link href={`/projects/${job.project.id}`} className="hover:underline max-w-[150px] truncate block">
                    {job.project.title}
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {job.episode ? `${job.episode.episodeNumber}화` : '-'}
              </TableCell>
              <TableCell>{formatDuration(job.createdAt, job.completedAt)}</TableCell>
              <TableCell>{formatDate(job.createdAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">작업 모니터링</h1>
        <p className="text-muted-foreground">비동기 작업 상태를 모니터링합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.statusCounts.PENDING)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처리중</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.statusCounts.PROCESSING)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.statusCounts.COMPLETED)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">실패</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.statusCounts.FAILED)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 처리</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.todayCompleted)}</div>
            <p className="text-xs text-muted-foreground">생성: {stats.todayCreated}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>작업 목록</CardTitle>
          <CardDescription>최근 50개 작업</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="pending">
                대기중 ({pendingJobs.length})
              </TabsTrigger>
              <TabsTrigger value="processing">
                처리중 ({processingJobs.length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                실패 ({failedJobs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <JobTable jobs={allJobs} />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <JobTable jobs={pendingJobs} />
            </TabsContent>
            <TabsContent value="processing" className="mt-4">
              <JobTable jobs={processingJobs} />
            </TabsContent>
            <TabsContent value="failed" className="mt-4">
              <JobTable jobs={failedJobs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
