'use client'

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { UserListItem } from '@/types/user'
import { SubscriptionTier } from '@prisma/client'
import { Eye, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserTableProps {
  users: UserListItem[]
}

const tierColors: Record<SubscriptionTier, 'default' | 'secondary' | 'outline'> = {
  FREE: 'secondary',
  BASIC: 'default',
  PRO: 'default',
  ENTERPRISE: 'default',
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이메일</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>플랜</TableHead>
            <TableHead className="text-right">일간 크레딧</TableHead>
            <TableHead className="text-right">주간 크레딧</TableHead>
            <TableHead className="text-right">충전 크레딧</TableHead>
            <TableHead className="text-right">프로젝트</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                사용자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <Link href={`/users/${user.id}`} className="hover:underline">
                    {user.email}
                  </Link>
                </TableCell>
                <TableCell>{user.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={tierColors[user.subscriptionTier]}>{user.subscriptionTier}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatNumber(user.dailyCredit)}</TableCell>
                <TableCell className="text-right">{formatNumber(user.weeklyCredit)}</TableCell>
                <TableCell className="text-right">{formatNumber(user.chargedCredit)}</TableCell>
                <TableCell className="text-right">{user._count.projects}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  {user.deletedAt ? (
                    <Badge variant="destructive">삭제됨</Badge>
                  ) : user.isEmailVerified ? (
                    <Badge variant="success">인증됨</Badge>
                  ) : (
                    <Badge variant="outline">미인증</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/users/${user.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세 보기
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
