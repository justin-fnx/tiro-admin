'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils/format'
import { Settings, MessageSquare, User, Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { ChatRole, SettingType } from '@prisma/client'

// AIDEV-NOTE: 프로젝트 작품 설정 및 대화 내용 표시 컴포넌트

interface Setting {
  id: string
  category: string
  type: SettingType
  data: unknown
  order: number
  icon: string | null
  createdAt: Date
  updatedAt: Date
}

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  turnNumber: number | null
  createdAt: Date
  metadata: unknown
}

interface ProjectSettingsPanelProps {
  settingsData: Record<string, unknown>
  settings: Setting[]
  chatMessages: ChatMessage[]
}

export function ProjectSettingsPanel({
  settingsData,
  settings,
  chatMessages,
}: ProjectSettingsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // 설정을 카테고리별로 그룹화
  const groupedSettings = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    },
    {} as Record<string, Setting[]>
  )

  // settingsData에서 주요 정보 추출
  const renderSettingsData = () => {
    if (!settingsData || Object.keys(settingsData).length === 0) {
      return <p className="text-sm text-muted-foreground">설정 데이터가 없습니다.</p>
    }

    return (
      <div className="space-y-3">
        {Object.entries(settingsData).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">{key}</p>
            <div className="text-sm">
              {typeof value === 'object' ? (
                <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Setting 항목 데이터 렌더링
  const renderSettingData = (setting: Setting) => {
    const data = setting.data as { name?: string; items?: Array<{ name?: string; description?: string }> }

    if (setting.type === 'LIST' && Array.isArray(data?.items)) {
      return (
        <div className="space-y-2">
          {data.items.map((item, idx) => (
            <div key={idx} className="border rounded p-2 bg-muted/30">
              {item.name && <p className="font-medium text-sm">{item.name}</p>}
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (setting.type === 'TEXT') {
      return (
        <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded overflow-auto max-h-40">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      )
    }

    return (
      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 작품 설정 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle>작품 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {/* settingsData (JSON) */}
            {Object.keys(settingsData || {}).length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">기본 설정 데이터</h4>
                {renderSettingsData()}
              </div>
            )}

            {/* 카테고리별 설정 */}
            {Object.keys(groupedSettings).length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">카테고리별 설정</h4>
                {Object.entries(groupedSettings)
                  .sort(([, a], [, b]) => (a[0]?.order || 0) - (b[0]?.order || 0))
                  .map(([category, categorySettings]) => {
                    const isExpanded = expandedCategories.has(category)
                    return (
                      <div key={category} className="border rounded-lg">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {categorySettings[0]?.icon && (
                              <span className="text-lg">{categorySettings[0].icon}</span>
                            )}
                            <span className="font-medium">{category}</span>
                            <Badge variant="secondary" className="ml-2">
                              {categorySettings.length}개
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-3 pt-0 space-y-3">
                            <Separator className="mb-3" />
                            {categorySettings
                              .sort((a, b) => a.order - b.order)
                              .map((setting) => (
                                <div key={setting.id}>
                                  {renderSettingData(setting)}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ) : (
              !settingsData || Object.keys(settingsData).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  설정된 작품 설정이 없습니다.
                </p>
              ) : null
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 설정 대화 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <CardTitle>설정 대화</CardTitle>
          {chatMessages.length > 0 && (
            <Badge variant="outline" className="ml-auto">
              {chatMessages.length}개 메시지
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                대화 내용이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'USER' ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'USER' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[85%] ${
                        message.role === 'USER' ? '' : 'text-right'
                      }`}
                    >
                      <div
                        className={`inline-block rounded-lg p-3 text-sm ${
                          message.role === 'USER'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-left">
                          {message.content.length > 500
                            ? `${message.content.slice(0, 500)}...`
                            : message.content}
                        </p>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {message.turnNumber !== null && (
                          <span className="mr-2">#{message.turnNumber}</span>
                        )}
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
