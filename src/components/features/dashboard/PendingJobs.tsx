'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/format'
import { AsyncJobStatus, AsyncJobType } from '@prisma/client'
import Link from 'next/link'

interface PendingJob {
  id: string
  jobType: AsyncJobType
  status: AsyncJobStatus
  createdAt: Date
  user: {
    email: string
    name: string | null
  }
  project: {
    title: string
  } | null
}

interface PendingJobsProps {
  jobs: PendingJob[]
}

const jobTypeLabels: Record<AsyncJobType, string> = {
  EPISODE_GENERATION: '회차 생성',
  BATCH_GENERATION: '배치 생성',
  REVIEW: '검토',
  AUTO_FIX: '자동 수정',
  BULK_EDIT: '일괄 편집',
  EXPORT: '내보내기',
  GRAMMAR_REVIEW: '문법 검토',
  SETTINGS_REVIEW: '설정 검토',
  ANALYZE: '분석',
}

const statusColors: Record<AsyncJobStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'warning'> = {
  PENDING: 'secondary',
  PROCESSING: 'warning',
  COMPLETED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'outline',
}

const statusLabels: Record<AsyncJobStatus, string> = {
  PENDING: '대기',
  PROCESSING: '진행',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소',
}

export function PendingJobs({ jobs }: PendingJobsProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>대기 중인 작업</CardTitle>
        <CardDescription>처리 대기 중인 작업 5개</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">대기 중인 작업이 없습니다.</p>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs?id=${job.id}`}
                className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{jobTypeLabels[job.jobType]}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.project?.title || '프로젝트 없음'} · {job.user.name || job.user.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={statusColors[job.status]}>{statusLabels[job.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(job.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
