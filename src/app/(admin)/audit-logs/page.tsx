import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { ScrollText, Shield } from 'lucide-react'
import { AdminActions } from '@/lib/utils/admin-logger'

const actionLabels: Record<string, string> = {
  [AdminActions.USER_CREDIT_ADJUST]: '크레딧 조정',
  [AdminActions.USER_PLAN_CHANGE]: '플랜 변경',
  [AdminActions.USER_DELETE]: '사용자 삭제',
  [AdminActions.PROJECT_DELETE]: '프로젝트 삭제',
  [AdminActions.PROJECT_STATUS_CHANGE]: '프로젝트 상태 변경',
  [AdminActions.AI_RATE_CREATE]: 'AI 요금 생성',
  [AdminActions.AI_RATE_UPDATE]: 'AI 요금 수정',
  [AdminActions.AI_RATE_DELETE]: 'AI 요금 삭제',
  [AdminActions.PROMOTION_CREATE]: '프로모션 생성',
  [AdminActions.PROMOTION_UPDATE]: '프로모션 수정',
  [AdminActions.PROMOTION_DELETE]: '프로모션 삭제',
  [AdminActions.ADMIN_CREATE]: '관리자 생성',
  [AdminActions.ADMIN_UPDATE]: '관리자 수정',
  [AdminActions.ADMIN_DELETE]: '관리자 삭제',
  [AdminActions.SETTING_UPDATE]: '설정 변경',
  [AdminActions.JOB_UPDATE]: '작업 상태 변경',
}

const actionColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [AdminActions.USER_DELETE]: 'destructive',
  [AdminActions.PROJECT_DELETE]: 'destructive',
  [AdminActions.AI_RATE_DELETE]: 'destructive',
  [AdminActions.PROMOTION_DELETE]: 'destructive',
  [AdminActions.ADMIN_DELETE]: 'destructive',
}

async function getAuditLogs() {
  return prisma.adminActivityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

async function getLogStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayLogs, totalLogs, uniqueAdmins] = await Promise.all([
    prisma.adminActivityLog.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.adminActivityLog.count(),
    prisma.adminActivityLog.groupBy({
      by: ['adminEmail'],
      _count: true,
    }),
  ])

  return { todayLogs, totalLogs, uniqueAdmins: uniqueAdmins.length }
}

export default async function AuditLogsPage() {
  const [logs, stats] = await Promise.all([getAuditLogs(), getLogStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">감사 로그</h1>
        <p className="text-muted-foreground">관리자 활동 기록을 확인합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 활동</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 로그</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활동 관리자</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>활동 기록</CardTitle>
          <CardDescription>최근 100개의 관리자 활동</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">활동 기록이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>관리자</TableHead>
                  <TableHead>작업</TableHead>
                  <TableHead>대상 유형</TableHead>
                  <TableHead>대상 ID</TableHead>
                  <TableHead>상세 정보</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.adminEmail}</TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] || 'default'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.targetType || '-'}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[100px] truncate">
                      {log.targetId || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-muted-foreground hover:text-foreground">
                            상세 보기
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
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
