import { SubscriptionTier } from '@prisma/client'

export interface UserListItem {
  id: string
  email: string
  name: string | null
  subscriptionTier: SubscriptionTier
  creditBalance: number
  chargedCredit: number
  dailyCredit: number
  weeklyCredit: number
  isEmailVerified: boolean
  createdAt: Date
  lastLoginAt: Date | null
  deletedAt: Date | null
  _count: {
    projects: number
  }
}

export interface UserDetail extends UserListItem {
  avatar: string | null
  subscriptionExpiry: Date | null
  emailVerifiedAt: Date | null
  dailyCreditResetAt: Date | null
  weeklyCreditResetAt: Date | null
}

export interface UserFilters {
  search?: string
  subscriptionTier?: SubscriptionTier | 'all'
  status?: 'active' | 'deleted' | 'all'
  isEmailVerified?: boolean | 'all'
}

export interface UsersResponse {
  users: UserListItem[]
  total: number
  page: number
  totalPages: number
}
