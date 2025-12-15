'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Bot,
  CreditCard,
  Tag,
  Activity,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSession } from 'next-auth/react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  requireSuperAdmin?: boolean
}

const navItems: NavItem[] = [
  { title: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { title: '사용자 관리', href: '/users', icon: Users },
  { title: '프로젝트', href: '/projects', icon: FolderKanban },
  { title: 'AI 설정', href: '/ai/credit-rates', icon: Bot },
  { title: '크레딧 관리', href: '/credits', icon: CreditCard },
  { title: '프로모션', href: '/promotions', icon: Tag },
  { title: '피드백 관리', href: '/reports', icon: MessageSquareText },
  { title: '작업 모니터링', href: '/jobs', icon: Activity },
  { title: '감사 로그', href: '/audit-logs', icon: FileText },
]

const settingsItems: NavItem[] = [
  { title: '관리자 관리', href: '/settings/admins', icon: Users, requireSuperAdmin: true },
  { title: '시스템 설정', href: '/settings/system', icon: Settings, requireSuperAdmin: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  const filteredSettingsItems = settingsItems.filter((item) => !item.requireSuperAdmin || isSuperAdmin)

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-xl font-bold">TIRO Admin</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {filteredSettingsItems.length > 0 && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-border" />
            </div>
            <nav className="space-y-1 px-2">
              {filteredSettingsItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                )
              })}
            </nav>
          </>
        )}
      </ScrollArea>
    </aside>
  )
}
