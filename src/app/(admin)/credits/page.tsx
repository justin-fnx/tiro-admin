import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { TransactionFilters } from '@/components/features/credits/TransactionFilters'
import { TransactionsTable } from '@/components/features/credits/TransactionsTable'
import { Pagination } from '@/components/ui/pagination'
import { CreditTransactionType, CreditType, Prisma } from '@prisma/client'

interface PageProps {
  searchParams: Promise<{
    page?: string
    type?: string
    creditType?: string
    userId?: string
    startDate?: string
    endDate?: string
    search?: string
  }>
}

async function getTransactions(searchParams: Awaited<PageProps['searchParams']>) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const limit = 20

  const where: Prisma.CreditTransactionWhereInput = {}

  if (searchParams.type && searchParams.type !== 'all') {
    where.type = searchParams.type as CreditTransactionType
  }

  if (searchParams.creditType && searchParams.creditType !== 'all') {
    where.creditType = searchParams.creditType as CreditType
  }

  if (searchParams.userId) {
    where.userId = searchParams.userId
  }

  if (searchParams.startDate) {
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) || {}),
      gte: new Date(searchParams.startDate),
    }
  }

  if (searchParams.endDate) {
    const end = new Date(searchParams.endDate)
    end.setHours(23, 59, 59, 999)
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) || {}),
      lte: end,
    }
  }

  if (searchParams.search) {
    where.OR = [
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
      { user: { name: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        creditType: true,
        description: true,
        paymentId: true,
        paymentMethod: true,
        priceKRW: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.creditTransaction.count({ where }),
  ])

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export default async function CreditsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { transactions, total, page, totalPages } = await getTransactions(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">크레딧 관리</h1>
        <p className="text-muted-foreground">전체 {total.toLocaleString()}건의 거래 내역</p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <TransactionFilters />
      </Suspense>

      <TransactionsTable transactions={transactions} />

      <Pagination currentPage={page} totalPages={totalPages} basePath="/credits" />
    </div>
  )
}
