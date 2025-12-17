'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Calendar } from 'lucide-react'
import { useState, useCallback } from 'react'

export function FailedJsonLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      params.set('page', '1')
      router.push(`/failed-json-logs?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = () => {
    updateFilters({ search })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDateFilter = () => {
    updateFilters({ startDate, endDate })
  }

  const clearFilters = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    router.push('/failed-json-logs')
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('startDate') ||
    searchParams.get('endDate') ||
    searchParams.get('userId') ||
    searchParams.get('projectId')

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="메시지, 에러, 사용자, 프로젝트 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-72"
        />
        <Button variant="secondary" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-36"
          placeholder="시작일"
        />
        <span className="text-muted-foreground">~</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-36"
          placeholder="종료일"
        />
        <Button variant="secondary" size="sm" onClick={handleDateFilter}>
          적용
        </Button>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          필터 초기화
        </Button>
      )}
    </div>
  )
}
