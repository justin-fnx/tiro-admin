import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { UserFilters } from '@/components/features/users/UserFilters'
import { UserTable } from '@/components/features/users/UserTable'
import { Pagination } from '@/components/ui/pagination'
import { SubscriptionTier, Prisma } from '@prisma/client'

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    subscriptionTier?: string
    status?: string
  }>
}

async function getUsers(searchParams: Awaited<PageProps['searchParams']>) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const limit = 20

  const where: Prisma.UserWhereInput = {}

  if (searchParams.search) {
    where.OR = [
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { name: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  if (searchParams.subscriptionTier && searchParams.subscriptionTier !== 'all') {
    where.subscriptionTier = searchParams.subscriptionTier as SubscriptionTier
  }

  if (searchParams.status === 'active') {
    where.deletedAt = null
  } else if (searchParams.status === 'deleted') {
    where.deletedAt = { not: null }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        creditBalance: true,
        chargedCredit: true,
        dailyCredit: true,
        weeklyCredit: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        deletedAt: true,
        _count: {
          select: { projects: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { users, total, page, totalPages } = await getUsers(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
        <p className="text-muted-foreground">전체 {total}명의 사용자</p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <UserFilters />
      </Suspense>

      <UserTable users={users} />

      <Pagination currentPage={page} totalPages={totalPages} basePath="/users" />
    </div>
  )
}
