import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import { EditSettingModal } from '@/components/features/settings/EditSettingModal'
import { EditLegalDocumentModal } from '@/components/features/settings/EditLegalDocumentModal'
import { AddSettingModal } from '@/components/features/settings/AddSettingModal'
import { Settings, FileText, Code } from 'lucide-react'
import {
  getSettingType,
  SettingType,
  SETTING_TYPE_LABELS,
  isLegalDocumentValue,
  LegalDocumentValue,
} from '@/lib/constants/setting-types'

// AIDEV-NOTE: 시스템 설정 페이지. 설정 타입에 따라 다른 편집 UI를 제공
// LEGAL_DOCUMENT 타입: 전용 편집기 (title, content, version, effectiveDate)
// JSON 타입: 일반 JSON 편집기

async function getSystemSettings() {
  return prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  })
}

function SettingTypeIcon({ type }: { type: SettingType }) {
  switch (type) {
    case SettingType.LEGAL_DOCUMENT:
      return <FileText className="h-4 w-4" />
    default:
      return <Code className="h-4 w-4" />
  }
}

function SettingValuePreview({ value, type }: { value: unknown; type: SettingType }) {
  if (type === SettingType.LEGAL_DOCUMENT && isLegalDocumentValue(value)) {
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{value.title}</div>
        <div className="text-xs text-muted-foreground">
          버전 {value.version} | 시행일: {value.effectiveDate}
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
          {value.content.slice(0, 100)}...
        </div>
      </div>
    )
  }

  return (
    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[100px] max-w-[300px]">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function EditButton({
  settingKey,
  value,
  description,
  type,
}: {
  settingKey: string
  value: unknown
  description: string | null
  type: SettingType
}) {
  if (type === SettingType.LEGAL_DOCUMENT && isLegalDocumentValue(value)) {
    return (
      <EditLegalDocumentModal
        settingKey={settingKey}
        value={value as LegalDocumentValue}
        description={description}
      />
    )
  }

  return (
    <EditSettingModal
      setting={{
        key: settingKey,
        value,
        description,
      }}
    />
  )
}

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
          <p className="text-muted-foreground">시스템 전역 설정을 관리합니다.</p>
        </div>
        <AddSettingModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            설정 목록
          </CardTitle>
          <CardDescription>
            설정 타입에 따라 전용 편집기가 제공됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              등록된 설정이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>키</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>마지막 수정자</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => {
                  const type = getSettingType(setting.key)
                  return (
                    <TableRow key={setting.key}>
                      <TableCell className="font-mono font-medium">{setting.key}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <SettingTypeIcon type={type} />
                          {SETTING_TYPE_LABELS[type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SettingValuePreview value={setting.value} type={type} />
                      </TableCell>
                      <TableCell className="max-w-[200px]">{setting.description || '-'}</TableCell>
                      <TableCell>{setting.updatedBy || '-'}</TableCell>
                      <TableCell>{formatDate(setting.updatedAt)}</TableCell>
                      <TableCell>
                        <EditButton
                          settingKey={setting.key}
                          value={setting.value}
                          description={setting.description}
                          type={type}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
