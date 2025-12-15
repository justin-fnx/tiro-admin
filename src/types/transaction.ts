import { CreditTransactionType, CreditType } from '@prisma/client'

export interface TransactionListItem {
  id: string
  userId: string
  amount: number
  type: CreditTransactionType
  creditType: CreditType | null
  description: string | null
  paymentId: string | null
  paymentMethod: string | null
  priceKRW: number | null
  createdAt: Date
  user: {
    email: string
    name: string | null
  }
}

export interface TransactionFilters {
  type?: CreditTransactionType | 'all'
  creditType?: CreditType | 'all'
  userId?: string
  startDate?: Date
  endDate?: Date
}

export interface TransactionsResponse {
  transactions: TransactionListItem[]
  total: number
  page: number
  totalPages: number
}
