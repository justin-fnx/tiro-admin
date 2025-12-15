'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState, useCallback } from 'react'

export function ReportFilters() {
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
      router.push(`/reports?${params.toString()}`)
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
    router.push('/reports')
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('type') ||
    searchParams.get('status')

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="제목, 내용, 사용자 검색..."
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
        value={searchParams.get('type') || 'all'}
        onValueChange={(value) => updateFilters('type', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 유형</SelectItem>
          <SelectItem value="BUG">버그</SelectItem>
          <SelectItem value="QUESTION">질문</SelectItem>
          <SelectItem value="FEATURE">기능 요청</SelectItem>
          <SelectItem value="OTHER">기타</SelectItem>
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
          <SelectItem value="PENDING">대기 중</SelectItem>
          <SelectItem value="IN_PROGRESS">처리 중</SelectItem>
          <SelectItem value="RESOLVED">해결됨</SelectItem>
          <SelectItem value="CLOSED">닫힘</SelectItem>
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
