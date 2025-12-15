'use client'

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { TransactionListItem } from '@/types/transaction'
import { CreditTransactionType, CreditType } from '@prisma/client'

interface TransactionsTableProps {
  transactions: TransactionListItem[]
}

const typeLabels: Record<CreditTransactionType, string> = {
  PURCHASE: '구매',
  INITIAL_CREDIT: '초기 지급',
  USAGE: '사용',
  REFUND: '환불',
  BONUS: '보너스',
  SUBSCRIPTION: '구독',
}

const typeColors: Record<CreditTransactionType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PURCHASE: 'default',
  INITIAL_CREDIT: 'secondary',
  USAGE: 'destructive',
  REFUND: 'outline',
  BONUS: 'default',
  SUBSCRIPTION: 'secondary',
}

const creditTypeLabels: Record<CreditType, string> = {
  CHARGED: '충전',
  SUBSCRIPTION: '구독',
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>일시</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>크레딧 유형</TableHead>
            <TableHead className="text-right">금액</TableHead>
            <TableHead>설명</TableHead>
            <TableHead>결제 정보</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                거래 내역이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(tx.createdAt)}
                </TableCell>
                <TableCell>
                  <Link href={`/users/${tx.userId}`} className="hover:underline">
                    <div className="font-medium">{tx.user.email}</div>
                    {tx.user.name && (
                      <div className="text-sm text-muted-foreground">{tx.user.name}</div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={typeColors[tx.type]}>{typeLabels[tx.type]}</Badge>
                </TableCell>
                <TableCell>
                  {tx.creditType ? (
                    <Badge variant="outline">{creditTypeLabels[tx.creditType]}</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {tx.amount >= 0 ? '+' : ''}
                    {formatNumber(tx.amount)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{tx.description || '-'}</TableCell>
                <TableCell>
                  {tx.priceKRW ? (
                    <div className="text-sm">
                      <div>{formatNumber(tx.priceKRW)}원</div>
                      {tx.paymentMethod && (
                        <div className="text-muted-foreground">{tx.paymentMethod}</div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
