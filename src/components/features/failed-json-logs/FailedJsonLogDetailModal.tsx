'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, ExternalLink, AlertTriangle, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'

interface FailedJsonLogUser {
  id: string
  email: string
  name: string | null
}

interface FailedJsonLogProject {
  id: string
  title: string
}

interface FailedJsonLog {
  id: string
  projectId: string
  episodeId: string | null
  userId: string
  userMessage: string
  rawJsonContent: string
  errorMessage: string | null
  context: Record<string, unknown> | null
  createdAt: string
  user: FailedJsonLogUser
  project: FailedJsonLogProject
}

interface FailedJsonLogDetailModalProps {
  log: FailedJsonLog
}

export function FailedJsonLogDetailModal({ log }: FailedJsonLogDetailModalProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'user' | 'json' | null>(null)

  const handleCopy = async (text: string, type: 'user' | 'json') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      alert('복사에 실패했습니다.')
    }
  }

  // AIDEV-NOTE: JSON을 파싱 시도하여 포맷팅, 실패 시 원본 반환
  const formatJson = (raw: string): string => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            JSON 파싱 실패 로그 상세
          </DialogTitle>
          <DialogDescription>
            {formatDate(log.createdAt)} 발생
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">사용자</Label>
                <div className="mt-1">
                  <Link
                    href={`/users/${log.user.id}`}
                    className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {log.user.name || log.user.email}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">프로젝트</Label>
                <div className="mt-1">
                  <Link
                    href={`/projects/${log.project.id}`}
                    className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {log.project.title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {log.episodeId && (
              <div>
                <Label className="text-muted-foreground">회차 ID</Label>
                <div className="mt-1 text-sm font-mono">{log.episodeId}</div>
              </div>
            )}

            {/* 에러 메시지 */}
            {log.errorMessage && (
              <div>
                <Label className="text-muted-foreground">에러 메시지</Label>
                <div className="mt-1">
                  <Badge variant="destructive" className="gap-1 text-wrap whitespace-normal">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {log.errorMessage}
                  </Badge>
                </div>
              </div>
            )}

            <Separator />

            {/* 사용자 메시지 */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">사용자 메시지 (입력)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(log.userMessage, 'user')}
                >
                  {copied === 'user' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm max-h-[200px] overflow-auto">
                {log.userMessage}
              </div>
            </div>

            <Separator />

            {/* 파싱 실패한 JSON */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">파싱 실패한 JSON (LLM 응답)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(log.rawJsonContent, 'json')}
                >
                  {copied === 'json' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-1 p-3 bg-slate-900 text-slate-100 rounded-md text-sm font-mono max-h-[300px] overflow-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {formatJson(log.rawJsonContent)}
                </pre>
              </div>
            </div>

            {/* 추가 컨텍스트 */}
            {log.context && Object.keys(log.context).length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">추가 컨텍스트</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono max-h-[200px] overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
