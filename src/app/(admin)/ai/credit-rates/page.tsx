import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EditCreditRateModal } from '@/components/features/ai/EditCreditRateModal'
import { AiSettingsNav } from '@/components/features/ai/AiSettingsNav'

async function getCreditRates() {
  const rates = await prisma.aiCreditRate.findMany({
    orderBy: [{ provider: 'asc' }, { model: 'asc' }],
  })

  // 프로바이더별로 그룹화
  const groupedRates = rates.reduce(
    (acc, rate) => {
      if (!acc[rate.provider]) {
        acc[rate.provider] = []
      }
      acc[rate.provider].push(rate)
      return acc
    },
    {} as Record<string, typeof rates>
  )

  return { rates, groupedRates }
}

export default async function CreditRatesPage() {
  const { groupedRates } = await getCreditRates()
  const providers = Object.keys(groupedRates)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 설정 관리</h1>
        <p className="text-muted-foreground">프로바이더/모델별 크레딧 비율을 관리합니다.</p>
      </div>

      <AiSettingsNav />

      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">등록된 크레딧 비율이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider}>
              <CardHeader>
                <CardTitle className="capitalize">{provider}</CardTitle>
                <CardDescription>{groupedRates[provider].length}개 모델</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>모델</TableHead>
                      <TableHead className="text-right">입력 비율</TableHead>
                      <TableHead className="text-right">출력 비율</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRates[provider].map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.model}</TableCell>
                        <TableCell className="text-right">{rate.input} 크레딧/1K 토큰</TableCell>
                        <TableCell className="text-right">{rate.output} 크레딧/1K 토큰</TableCell>
                        <TableCell>
                          <Badge variant={rate.isActive ? 'success' : 'secondary'}>
                            {rate.isActive ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <EditCreditRateModal rate={rate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
