'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatRole } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { FileText, MessageSquare, History, ChevronDown, ChevronRight, Zap, User, Bot } from 'lucide-react'

// AIDEV-NOTE: 에피소드 상세 정보를 표시하는 모달 - 리비전 목록과 대화 이력 포함
interface ChatMessage {
  id: string
  episodeId: string | null
  revisionId: string | null
  role: ChatRole
  content: string
  turnNumber: number | null
  createdAt: string
}

interface RevisionWithMessages {
  id: string
  version: string
  content: string
  changeDescription: string | null
  wordCount: number
  createdAt: string
  creditsUsed: number
  parentRevisionId: string | null
  chatMessages: ChatMessage[]
}

interface EpisodeDetail {
  id: string
  episodeNumber: number
  title: string | null
  summary: string | null
  status: string
  wordCount: number
  creditsUsed: number
  createdAt: string
  updatedAt: string
  project: {
    id: string
    title: string
  }
  user: {
    id: string
    email: string
    name: string | null
  }
  activeRevision: {
    id: string
    version: string
    content: string
    wordCount: number
    createdAt: string
  } | null
  revisions: RevisionWithMessages[]
  chatMessages: ChatMessage[]
}

interface EpisodeDetailModalProps {
  episodeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EpisodeDetailModal({ episodeId, open, onOpenChange }: EpisodeDetailModalProps) {
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set())

  const fetchEpisodeDetail = useCallback(async () => {
    if (!episodeId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/episodes/${episodeId}`)
      if (res.ok) {
        const data = await res.json()
        setEpisode(data)
        // 첫 번째 리비전 자동 확장
        if (data.revisions?.length > 0) {
          setExpandedRevisions(new Set([data.revisions[0].id]))
        }
      }
    } catch (error) {
      console.error('Failed to fetch episode detail:', error)
    } finally {
      setLoading(false)
    }
  }, [episodeId])

  useEffect(() => {
    if (open && episodeId) {
      fetchEpisodeDetail()
    } else {
      setEpisode(null)
      setExpandedRevisions(new Set())
    }
  }, [open, episodeId, fetchEpisodeDetail])

  const toggleRevision = (revisionId: string) => {
    setExpandedRevisions((prev) => {
      const next = new Set(prev)
      if (next.has(revisionId)) {
        next.delete(revisionId)
      } else {
        next.add(revisionId)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {episode ? `${episode.episodeNumber}화: ${episode.title || '제목 없음'}` : '회차 상세'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        ) : episode ? (
          <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                내용
              </TabsTrigger>
              <TabsTrigger value="revisions" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                리비전 ({episode.revisions.length})
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                대화 이력
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 min-h-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">상태</p>
                      <Badge variant="outline">{episode.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">글자 수</p>
                      <p className="font-medium">{formatNumber(episode.wordCount)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">사용 크레딧</p>
                      <p className="font-medium flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {formatNumber(episode.creditsUsed)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">생성일</p>
                      <p className="font-medium">{formatDate(episode.createdAt)}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* 요약 */}
                  {episode.summary && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">요약</p>
                        <p className="text-sm">{episode.summary}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* 현재 활성 리비전 내용 */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      현재 내용 {episode.activeRevision && `(${episode.activeRevision.version})`}
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {episode.activeRevision?.content || '내용 없음'}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="revisions" className="flex-1 min-h-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {episode.revisions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">리비전이 없습니다.</p>
                  ) : (
                    episode.revisions.map((revision) => (
                      <Card key={revision.id} className="overflow-hidden">
                        <CardHeader
                          className="cursor-pointer py-3 hover:bg-muted/50"
                          onClick={() => toggleRevision(revision.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {expandedRevisions.has(revision.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <CardTitle className="text-sm font-medium">
                                {revision.version}
                              </CardTitle>
                              {episode.activeRevision?.id === revision.id && (
                                <Badge variant="secondary" className="text-xs">
                                  활성
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatNumber(revision.wordCount)} 자</span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {revision.creditsUsed}
                              </span>
                              <span>{formatDate(revision.createdAt)}</span>
                            </div>
                          </div>
                          {revision.changeDescription && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              {revision.changeDescription}
                            </p>
                          )}
                        </CardHeader>
                        {expandedRevisions.has(revision.id) && (
                          <CardContent className="pt-0">
                            <Separator className="mb-3" />
                            {/* 리비전 내용 */}
                            <div className="bg-muted/30 rounded-lg p-3 mb-3">
                              <pre className="whitespace-pre-wrap text-sm font-mono max-h-60 overflow-auto">
                                {revision.content || '내용 없음'}
                              </pre>
                            </div>
                            {/* 리비전 관련 대화 이력 */}
                            {revision.chatMessages.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  대화 이력 ({revision.chatMessages.length})
                                </p>
                                <div className="space-y-2 max-h-40 overflow-auto">
                                  {revision.chatMessages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex gap-2 text-xs ${
                                        msg.role === 'USER' ? 'justify-end' : 'justify-start'
                                      }`}
                                    >
                                      <div
                                        className={`max-w-[80%] rounded-lg p-2 ${
                                          msg.role === 'USER'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 mb-1 opacity-70">
                                          {msg.role === 'USER' ? (
                                            <User className="h-3 w-3" />
                                          ) : (
                                            <Bot className="h-3 w-3" />
                                          )}
                                          <span>{msg.role === 'USER' ? '사용자' : 'AI'}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 min-h-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {episode.chatMessages.length === 0 &&
                  episode.revisions.every((r) => r.chatMessages.length === 0) ? (
                    <p className="text-center text-muted-foreground py-8">대화 이력이 없습니다.</p>
                  ) : (
                    <>
                      {/* 에피소드 전체 대화 이력 */}
                      {episode.chatMessages.length > 0 && (
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">에피소드 대화</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {episode.chatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex gap-3 ${
                                    msg.role === 'USER' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[85%] rounded-lg p-3 ${
                                      msg.role === 'USER'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                                      {msg.role === 'USER' ? (
                                        <User className="h-3 w-3" />
                                      ) : (
                                        <Bot className="h-3 w-3" />
                                      )}
                                      <span>{msg.role === 'USER' ? '사용자' : 'AI'}</span>
                                      <span className="ml-auto">{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 리비전별 대화 이력 */}
                      {episode.revisions
                        .filter((r) => r.chatMessages.length > 0)
                        .map((revision) => (
                          <Card key={revision.id}>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">
                                {revision.version} 대화 ({revision.chatMessages.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {revision.chatMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex gap-3 ${
                                      msg.role === 'USER' ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <div
                                      className={`max-w-[85%] rounded-lg p-3 ${
                                        msg.role === 'USER'
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                                        {msg.role === 'USER' ? (
                                          <User className="h-3 w-3" />
                                        ) : (
                                          <Bot className="h-3 w-3" />
                                        )}
                                        <span>{msg.role === 'USER' ? '사용자' : 'AI'}</span>
                                        <span className="ml-auto">{formatDate(msg.createdAt)}</span>
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">데이터를 불러올 수 없습니다.</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
