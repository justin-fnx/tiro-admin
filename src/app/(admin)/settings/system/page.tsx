import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { EditSettingModal } from '@/components/features/settings/EditSettingModal'
import { Settings } from 'lucide-react'

async function getSystemSettings() {
  return prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  })
}

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground">시스템 전역 설정을 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            설정 목록
          </CardTitle>
          <CardDescription>
            값은 JSON 형식으로 저장됩니다. 변경 시 주의하세요.
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
                  <TableHead>값</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>마지막 수정자</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.key}>
                    <TableCell className="font-mono font-medium">{setting.key}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[100px]">
                        {JSON.stringify(setting.value, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell className="max-w-[200px]">{setting.description || '-'}</TableCell>
                    <TableCell>{setting.updatedBy || '-'}</TableCell>
                    <TableCell>{formatDate(setting.updatedAt)}</TableCell>
                    <TableCell>
                      <EditSettingModal
                        setting={{
                          key: setting.key,
                          value: setting.value,
                          description: setting.description,
                        }}
                      />
                    </TableCell>
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
