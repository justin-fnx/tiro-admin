import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'
import { AddAdminModal } from '@/components/features/settings/AddAdminModal'
import { EditAdminModal } from '@/components/features/settings/EditAdminModal'
import { DeleteAdminButton } from '@/components/features/settings/DeleteAdminButton'
import { Shield, ShieldCheck, Users } from 'lucide-react'

const roleLabels: Record<string, string> = {
  ADMIN: '일반 관리자',
  SUPER_ADMIN: '슈퍼 관리자',
}

const roleColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'secondary',
  SUPER_ADMIN: 'default',
}

async function getAdmins() {
  return prisma.adminWhitelist.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

async function getAdminStats() {
  const [total, active, superAdmins] = await Promise.all([
    prisma.adminWhitelist.count(),
    prisma.adminWhitelist.count({ where: { isActive: true } }),
    prisma.adminWhitelist.count({ where: { role: 'SUPER_ADMIN' } }),
  ])

  return { total, active, superAdmins }
}

export default async function AdminsSettingsPage() {
  const session = await getServerSession(authOptions)
  const currentUserEmail = session?.user?.email || ''
  const [admins, stats] = await Promise.all([getAdmins(), getAdminStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">관리자 설정</h1>
          <p className="text-muted-foreground">관리자 화이트리스트를 관리합니다.</p>
        </div>
        <AddAdminModal />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 관리자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 관리자</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">슈퍼 관리자</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.superAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
          <CardDescription>
            등록된 이메일로 Google 로그인 시 관리자 패널에 접근할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>마지막 로그인</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[100px]">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.email}
                    {admin.email === currentUserEmail && (
                      <Badge variant="outline" className="ml-2">
                        나
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{admin.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={roleColors[admin.role]}>{roleLabels[admin.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    {admin.isActive ? (
                      <Badge variant="success">활성</Badge>
                    ) : (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : '로그인 기록 없음'}
                  </TableCell>
                  <TableCell>{formatDate(admin.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditAdminModal
                        admin={{
                          id: admin.id,
                          email: admin.email,
                          name: admin.name,
                          role: admin.role,
                          isActive: admin.isActive,
                        }}
                        currentUserEmail={currentUserEmail}
                      />
                      <DeleteAdminButton
                        adminId={admin.id}
                        email={admin.email}
                        isSelf={admin.email === currentUserEmail}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
