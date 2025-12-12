'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState, useCallback } from 'react'

export function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.set('page', '1')
      router.push(`/users?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = () => {
    updateFilters('search', search)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/users')
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('subscriptionTier') ||
    searchParams.get('status')

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="이메일 또는 이름 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-64"
        />
        <Button variant="secondary" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={searchParams.get('subscriptionTier') || 'all'}
        onValueChange={(value) => updateFilters('subscriptionTier', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="플랜" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 플랜</SelectItem>
          <SelectItem value="FREE">Free</SelectItem>
          <SelectItem value="BASIC">Basic</SelectItem>
          <SelectItem value="PRO">Pro</SelectItem>
          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateFilters('status', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="active">활성</SelectItem>
          <SelectItem value="deleted">삭제됨</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          필터 초기화
        </Button>
      )}
    </div>
  )
}
