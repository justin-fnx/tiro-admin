import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { CreatePromotionModal } from '@/components/features/promotions/CreatePromotionModal'
import { EditPromotionModal } from '@/components/features/promotions/EditPromotionModal'
import { DeletePromotionButton } from '@/components/features/promotions/DeletePromotionButton'
import { Ticket, Gift, Users, TrendingUp } from 'lucide-react'

async function getPromotions() {
  return prisma.promotionCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { usages: true } },
    },
  })
}

async function getPromotionStats() {
  const [total, active, totalUsages, totalCreditsGiven] = await Promise.all([
    prisma.promotionCode.count(),
    prisma.promotionCode.count({ where: { isActive: true } }),
    prisma.promotionCodeUsage.count(),
    prisma.promotionCodeUsage.aggregate({
      _sum: { creditAmount: true },
    }),
  ])

  return {
    total,
    active,
    totalUsages,
    totalCreditsGiven: totalCreditsGiven._sum.creditAmount || 0,
  }
}

function getPromotionStatus(
  promotion: { isActive: boolean; expiresAt: Date | null; quota: number | null },
  usageCount: number
): { label: string; variant: 'success' | 'secondary' | 'destructive' | 'outline' } {
  if (!promotion.isActive) {
    return { label: '비활성', variant: 'secondary' }
  }
  if (promotion.expiresAt && new Date(promotion.expiresAt) < new Date()) {
    return { label: '만료됨', variant: 'destructive' }
  }
  if (promotion.quota && usageCount >= promotion.quota) {
    return { label: '소진됨', variant: 'outline' }
  }
  return { label: '활성', variant: 'success' }
}

export default async function PromotionsPage() {
  const [promotions, stats] = await Promise.all([getPromotions(), getPromotionStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로모션 코드</h1>
          <p className="text-muted-foreground">프로모션 코드를 생성하고 관리합니다.</p>
        </div>
        <CreatePromotionModal />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 코드</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 코드</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용 횟수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsages)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 지급 크레딧</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCreditsGiven)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로모션 코드 목록</CardTitle>
          <CardDescription>총 {promotions.length}개의 프로모션 코드</CardDescription>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              프로모션 코드가 없습니다. 새로운 코드를 생성해보세요.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">크레딧</TableHead>
                  <TableHead className="text-right">사용/제한</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="w-[100px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => {
                  const status = getPromotionStatus(promotion, promotion._count.usages)
                  return (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-mono font-medium">{promotion.code}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(promotion.creditAmount)}</TableCell>
                      <TableCell className="text-right">
                        {promotion._count.usages}
                        {promotion.quota ? ` / ${promotion.quota}` : ' / ∞'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {promotion.description || '-'}
                      </TableCell>
                      <TableCell>
                        {promotion.expiresAt ? formatDate(promotion.expiresAt) : '무기한'}
                      </TableCell>
                      <TableCell>{formatDate(promotion.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditPromotionModal
                            promotion={{
                              id: promotion.id,
                              code: promotion.code,
                              creditAmount: promotion.creditAmount,
                              quota: promotion.quota,
                              description: promotion.description,
                              expiresAt: promotion.expiresAt?.toISOString() || null,
                              isActive: promotion.isActive,
                            }}
                          />
                          <DeletePromotionButton promotionId={promotion.id} code={promotion.code} />
                        </div>
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
