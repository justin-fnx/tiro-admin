import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EditProviderConfigModal } from '@/components/features/ai/EditProviderConfigModal'
import { featureLabels } from '@/lib/constants/ai-features'
import { AiSettingsNav } from '@/components/features/ai/AiSettingsNav'
import { AiFeature } from '@prisma/client'

async function getProviderConfigs() {
  const configs = await prisma.aiProviderConfig.findMany({
    orderBy: { feature: 'asc' },
  })

  return configs
}

export default async function ProvidersPage() {
  const configs = await getProviderConfigs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 설정 관리</h1>
        <p className="text-muted-foreground">기능별 AI 프로바이더 및 모델 설정을 관리합니다.</p>
      </div>

      <AiSettingsNav />

      <Card>
        <CardHeader>
          <CardTitle>기능별 프로바이더 설정</CardTitle>
          <CardDescription>각 기능에 사용되는 AI 프로바이더와 모델을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">등록된 프로바이더 설정이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기능</TableHead>
                  <TableHead>프로바이더</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{featureLabels[config.feature as AiFeature]}</TableCell>
                    <TableCell className="capitalize">{config.provider}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">{config.model}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.isActive ? 'success' : 'secondary'}>
                        {config.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <EditProviderConfigModal config={config} />
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
