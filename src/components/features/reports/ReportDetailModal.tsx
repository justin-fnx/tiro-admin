'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Eye, Bug, HelpCircle, Lightbulb, MessageSquare, ExternalLink } from 'lucide-react'
import { UserReportType, UserReportStatus } from '@prisma/client'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'

interface ReportUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
}

interface Report {
  id: string
  type: UserReportType
  status: UserReportStatus
  title: string
  content: string
  pageUrl: string | null
  userAgent: string | null
  metadata: Record<string, unknown>
  adminNote: string | null
  createdAt: string
  updatedAt: string
  user: ReportUser
}

interface ReportDetailModalProps {
  report: Report
}

// AIDEV-NOTE: 피드백 유형별 아이콘 및 라벨 매핑
function getTypeInfo(type: UserReportType) {
  switch (type) {
    case 'BUG':
      return { icon: Bug, label: '버그', variant: 'destructive' as const }
    case 'QUESTION':
      return { icon: HelpCircle, label: '질문', variant: 'secondary' as const }
    case 'FEATURE':
      return { icon: Lightbulb, label: '기능 요청', variant: 'outline' as const }
    case 'OTHER':
    default:
      return { icon: MessageSquare, label: '기타', variant: 'default' as const }
  }
}

// AIDEV-NOTE: 피드백 상태별 라벨 매핑
const statusLabels: Record<UserReportStatus, string> = {
  PENDING: '대기 중',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결됨',
  CLOSED: '닫힘',
}

export function ReportDetailModal({ report }: ReportDetailModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: report.status,
    adminNote: report.adminNote || '',
  })

  const typeInfo = getTypeInfo(report.type)
  const TypeIcon = typeInfo.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetchWithAuth(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          adminNote: formData.adminNote || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '피드백 수정 실패')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증이 만료')) return
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={typeInfo.variant} className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </Badge>
              {report.title}
            </DialogTitle>
            <DialogDescription>
              {formatDate(report.createdAt)} 작성
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 사용자 정보 */}
            <div>
              <Label className="text-muted-foreground">작성자</Label>
              <div className="mt-1">
                <Link
                  href={`/users/${report.user.id}`}
                  className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  {report.user.name || report.user.email}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                {report.user.name && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({report.user.email})
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* 피드백 내용 */}
            <div>
              <Label className="text-muted-foreground">내용</Label>
              <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                {report.content}
              </div>
            </div>

            {/* 페이지 URL */}
            {report.pageUrl && (
              <div>
                <Label className="text-muted-foreground">페이지 URL</Label>
                <div className="mt-1">
                  <a
                    href={report.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {report.pageUrl}
                  </a>
                </div>
              </div>
            )}

            {/* User Agent */}
            {report.userAgent && (
              <div>
                <Label className="text-muted-foreground">브라우저/OS 정보</Label>
                <div className="mt-1 text-sm text-muted-foreground break-all">
                  {report.userAgent}
                </div>
              </div>
            )}

            {/* 메타데이터 (스크린샷 URL 등) */}
            {report.metadata && Object.keys(report.metadata).length > 0 && (
              <div>
                <Label className="text-muted-foreground">추가 정보</Label>
                <div className="mt-1 p-2 bg-muted rounded-md text-sm font-mono">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(report.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <Separator />

            {/* 상태 변경 */}
            <div className="grid gap-2">
              <Label htmlFor="status">상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as UserReportStatus })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 관리자 메모 */}
            <div className="grid gap-2">
              <Label htmlFor="adminNote">관리자 메모</Label>
              <Textarea
                id="adminNote"
                placeholder="내부 메모를 입력하세요..."
                value={formData.adminNote}
                onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
