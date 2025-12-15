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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Eye, FileEdit } from 'lucide-react'
import { LegalDocumentValue } from '@/lib/constants/setting-types'

// AIDEV-NOTE: 법률 문서(개인정보처리방침, 이용약관 등) 전용 편집 모달
// title, content(마크다운), version, effectiveDate 필드를 개별 입력받음

interface EditLegalDocumentModalProps {
  settingKey: string
  value: LegalDocumentValue
  description: string | null
}

// 간단한 마크다운 렌더링 (미리보기용)
function SimpleMarkdownPreview({ content }: { content: string }) {
  // 기본적인 마크다운 파싱 (# 제목, ** 볼드, - 리스트)
  const lines = content.split('\n')

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, index) => {
        // 제목 처리
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>
        }
        // 리스트 항목 처리
        if (line.startsWith('- ')) {
          // 볼드 처리
          const parsed = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          return (
            <li key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: parsed }} />
          )
        }
        // 빈 줄
        if (line.trim() === '') {
          return <br key={index} />
        }
        // 일반 텍스트 (볼드 처리)
        const parsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return <p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: parsed }} />
      })}
    </div>
  )
}

export function EditLegalDocumentModal({ settingKey, value, description }: EditLegalDocumentModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('edit')

  const [title, setTitle] = useState(value.title)
  const [content, setContent] = useState(value.content)
  const [version, setVersion] = useState(value.version)
  const [effectiveDate, setEffectiveDate] = useState(value.effectiveDate)
  const [settingDescription, setSettingDescription] = useState(description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newValue: LegalDocumentValue = {
        title,
        content,
        version,
        effectiveDate,
      }

      const response = await fetchWithAuth('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: settingKey,
          value: newValue,
          description: settingDescription || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '설정 수정 실패')
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

  const getKeyLabel = (key: string) => {
    switch (key) {
      case 'PRIVACY_POLICY':
        return '개인정보 처리방침'
      case 'TERMS_OF_SERVICE':
        return '이용약관'
      default:
        return key
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              {getKeyLabel(settingKey)} 수정
            </DialogTitle>
            <DialogDescription className="font-mono">{settingKey}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문서 제목"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">버전</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="effectiveDate">시행일</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">설정 설명</Label>
                <Input
                  id="description"
                  value={settingDescription}
                  onChange={(e) => setSettingDescription(e.target.value)}
                  placeholder="이 설정에 대한 설명"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>내용 (마크다운)</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="edit" className="flex items-center gap-1">
                    <FileEdit className="h-3 w-3" />
                    편집
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    미리보기
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-2">
                  <textarea
                    className="flex min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="마크다운 형식으로 내용을 입력하세요..."
                    required
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                  <div className="min-h-[400px] w-full rounded-md border border-input bg-muted/30 px-4 py-3 overflow-auto">
                    {content ? (
                      <SimpleMarkdownPreview content={content} />
                    ) : (
                      <p className="text-muted-foreground text-sm">내용을 입력하면 미리보기가 표시됩니다.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                마크다운 문법을 지원합니다. (# 제목, ## 소제목, - 목록, **볼드**)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
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
