import { PromotionCodeType } from '@prisma/client'

export interface PromotionCodeListItem {
  id: string
  code: string
  type: PromotionCodeType
  creditAmount: number
  quota: number | null
  usedCount: number
  isActive: boolean
  description: string | null
  expiresAt: Date | null
  createdAt: Date
}

export interface PromotionCodeUsageItem {
  id: string
  userId: string
  creditAmount: number
  createdAt: Date
  user: {
    email: string
    name: string | null
  }
}

export interface PromotionCodeFilters {
  type?: PromotionCodeType | 'all'
  isActive?: boolean | 'all'
  search?: string
}

export interface PromotionCodesResponse {
  promotionCodes: PromotionCodeListItem[]
  total: number
  page: number
  totalPages: number
}

export interface CreatePromotionCodeInput {
  code: string
  type: PromotionCodeType
  creditAmount: number
  quota?: number | null
  description?: string
  expiresAt?: Date | null
}
