import { prisma } from '@/lib/db/prisma'
import { StatCards } from '@/components/features/dashboard/StatCards'
import { UsageChart } from '@/components/features/dashboard/UsageChart'
import { RecentUsers } from '@/components/features/dashboard/RecentUsers'
import { PendingJobs } from '@/components/features/dashboard/PendingJobs'
import { CreditTransactionType, AsyncJobStatus } from '@prisma/client'
import { subDays, format } from 'date-fns'

async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [totalUsers, yesterdayUsers, todaySignups, activeProjects, todayAiUsageResult] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: { deletedAt: null, createdAt: { lt: today } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: today }, deletedAt: null },
      }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.creditTransaction.aggregate({
        where: {
          type: CreditTransactionType.USAGE,
          createdAt: { gte: today },
        },
        _sum: { amount: true },
      }),
    ])

  const todayAiUsage = Math.abs(todayAiUsageResult._sum.amount || 0)
  const userGrowthPercent =
    yesterdayUsers > 0 ? ((totalUsers - yesterdayUsers) / yesterdayUsers) * 100 : 0

  return {
    totalUsers,
    todaySignups,
    activeProjects,
    todayAiUsage,
    userGrowthPercent: Math.round(userGrowthPercent * 10) / 10,
  }
}

async function getUsageChartData() {
  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const dates: Date[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(subDays(today, i))
  }

  const [users, transactions] = await Promise.all([
    prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        deletedAt: null,
      },
      select: { createdAt: true },
    }),
    prisma.creditTransaction.findMany({
      where: {
        type: CreditTransactionType.USAGE,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, amount: true },
    }),
  ])

  return dates.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const signups = users.filter((u) => {
      const created = new Date(u.createdAt)
      return created >= dayStart && created <= dayEnd
    }).length

    const aiUsage = transactions
      .filter((t) => {
        const created = new Date(t.createdAt)
        return created >= dayStart && created <= dayEnd
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return { date: dateStr, signups, aiUsage }
  })
}

async function getRecentUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      subscriptionTier: true,
      createdAt: true,
    },
  })
}

async function getPendingJobs() {
  return prisma.asyncJob.findMany({
    where: {
      status: { in: [AsyncJobStatus.PENDING, AsyncJobStatus.PROCESSING] },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      jobType: true,
      status: true,
      createdAt: true,
      user: {
        select: { email: true, name: true },
      },
      project: {
        select: { title: true },
      },
    },
  })
}

export default async function DashboardPage() {
  const [stats, usageData, recentUsers, pendingJobs] = await Promise.all([
    getDashboardStats(),
    getUsageChartData(),
    getRecentUsers(),
    getPendingJobs(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">TIRO 서비스 운영 현황을 확인하세요.</p>
      </div>

      <StatCards {...stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <UsageChart data={usageData} />
        <RecentUsers users={recentUsers} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4" />
        <PendingJobs jobs={pendingJobs} />
      </div>
    </div>
  )
}
