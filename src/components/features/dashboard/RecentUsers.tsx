'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/format'
import Link from 'next/link'

interface RecentUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  subscriptionTier: string
  createdAt: Date
}

interface RecentUsersProps {
  users: RecentUser[]
}

const tierColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  FREE: 'secondary',
  BASIC: 'default',
  PRO: 'default',
  ENTERPRISE: 'default',
}

export function RecentUsers({ users }: RecentUsersProps) {
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>최근 가입 사용자</CardTitle>
        <CardDescription>최근 가입한 사용자 5명</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">최근 가입한 사용자가 없습니다.</p>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={tierColors[user.subscriptionTier] || 'secondary'}>
                    {user.subscriptionTier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
