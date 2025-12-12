'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderKanban, UserPlus, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { formatNumber } from '@/lib/utils/format'

interface StatCardsProps {
  totalUsers: number
  todaySignups: number
  activeProjects: number
  todayAiUsage: number
  userGrowthPercent: number
}

export function StatCards({
  totalUsers,
  todaySignups,
  activeProjects,
  todayAiUsage,
  userGrowthPercent,
}: StatCardsProps) {
  const stats = [
    {
      title: '총 사용자',
      value: formatNumber(totalUsers),
      icon: Users,
      description:
        userGrowthPercent >= 0
          ? `전일 대비 +${userGrowthPercent}%`
          : `전일 대비 ${userGrowthPercent}%`,
      trend: userGrowthPercent >= 0 ? 'up' : 'down',
    },
    {
      title: '오늘 가입자',
      value: formatNumber(todaySignups),
      icon: UserPlus,
      description: '오늘 새로 가입한 사용자',
    },
    {
      title: '활성 프로젝트',
      value: formatNumber(activeProjects),
      icon: FolderKanban,
      description: '현재 진행 중인 프로젝트',
    },
    {
      title: '오늘 AI 사용량',
      value: formatNumber(todayAiUsage),
      icon: Zap,
      description: '오늘 사용된 크레딧',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
