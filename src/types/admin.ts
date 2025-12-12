import { AdminRole } from '@prisma/client'

export interface AdminListItem {
  id: string
  email: string
  name: string | null
  role: AdminRole
  isActive: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

export interface AdminActivityLogItem {
  id: string
  adminEmail: string
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

export interface SystemSettingItem {
  key: string
  value: Record<string, unknown>
  description: string | null
  updatedAt: Date
  updatedBy: string | null
}

export interface DashboardStats {
  totalUsers: number
  todaySignups: number
  activeProjects: number
  todayAiUsage: number
  userGrowthPercent: number
}

export interface UsageChartData {
  date: string
  signups: number
  aiUsage: number
}
