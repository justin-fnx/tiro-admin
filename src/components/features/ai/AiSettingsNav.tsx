'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// AIDEV-NOTE: AI 설정 페이지들 간의 탭 네비게이션 컴포넌트
const tabs = [
  { href: '/ai/credit-rates', label: '크레딧 비율' },
  { href: '/ai/providers', label: '프로바이더 설정' },
]

export function AiSettingsNav() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
