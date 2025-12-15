import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { CreditAdjustModal } from '@/components/features/users/CreditAdjustModal'
import { PlanChangeModal } from '@/components/features/users/PlanChangeModal'
import { ArrowLeft, Mail, Calendar, Clock, CreditCard, FolderKanban } from 'lucide-react'
import { SubscriptionTier, CreditTransactionType } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string }>
}

const tierColors: Record<SubscriptionTier, 'default' | 'secondary' | 'outline'> = {
  FREE: 'secondary',
  BASIC: 'default',
  PRO: 'default',
  ENTERPRISE: 'default',
}

const transactionTypeLabels: Record<CreditTransactionType, string> = {
  PURCHASE: '구매',
  INITIAL_CREDIT: '초기 지급',
  USAGE: '사용',
  REFUND: '환불',
  BONUS: '보너스',
  SUBSCRIPTION: '구독',
}

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: { select: { episodes: true } },
        },
      },
      creditTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      },
    },
  })
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 프로필 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">이름</span>
              <span>{user.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">이메일 인증</span>
              {user.isEmailVerified ? (
                <Badge variant="success">인증됨</Badge>
              ) : (
                <Badge variant="outline">미인증</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">상태</span>
              {user.deletedAt ? (
                <Badge variant="destructive">삭제됨</Badge>
              ) : (
                <Badge variant="success">활성</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 구독 정보 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              구독 정보
            </CardTitle>
            <PlanChangeModal
              userId={user.id}
              currentTier={user.subscriptionTier}
              currentExpiry={user.subscriptionExpiry}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">플랜</span>
              <Badge variant={tierColors[user.subscriptionTier]}>{user.subscriptionTier}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">만료일</span>
              <span>{user.subscriptionExpiry ? formatDate(user.subscriptionExpiry) : '무기한'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">가입일</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">마지막 로그인</span>
              <span>{user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* 크레딧 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              크레딧
            </CardTitle>
            <CreditAdjustModal
              userId={user.id}
              currentCredits={{
                chargedCredit: user.chargedCredit,
                dailyCredit: user.dailyCredit,
                weeklyCredit: user.weeklyCredit,
              }}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">충전 크레딧</span>
              <span>{formatNumber(user.chargedCredit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">일일 크레딧</span>
              <span>{formatNumber(user.dailyCredit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">주간 크레딧</span>
              <span>{formatNumber(user.weeklyCredit)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 프로젝트 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              프로젝트
            </CardTitle>
            <CardDescription>최근 10개 프로젝트</CardDescription>
          </CardHeader>
          <CardContent>
            {user.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">프로젝트가 없습니다.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>회차</TableHead>
                    <TableHead>생성일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link href={`/projects/${project.id}`} className="hover:underline">
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.status}</Badge>
                      </TableCell>
                      <TableCell>{project._count.episodes}</TableCell>
                      <TableCell>{formatDate(project.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 거래 내역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              거래 내역
            </CardTitle>
            <CardDescription>최근 20건의 거래</CardDescription>
          </CardHeader>
          <CardContent>
            {user.creditTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">거래 내역이 없습니다.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유형</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>날짜</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.creditTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Badge variant="outline">{transactionTypeLabels[tx.type]}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {formatNumber(tx.amount)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
