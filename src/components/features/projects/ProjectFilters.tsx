'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, ArrowUpDown } from 'lucide-react'
import { useState, useCallback } from 'react'

const statusOptions = [
  { value: 'all', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'ARCHIVED', label: '보관' },
  { value: 'DELETED', label: '삭제' },
]

const sortOptions = [
  { value: 'createdAt:desc', label: '최신순' },
  { value: 'createdAt:asc', label: '오래된순' },
  { value: 'title:asc', label: '제목 (가나다순)' },
  { value: 'title:desc', label: '제목 (역순)' },
  { value: 'updatedAt:desc', label: '최근 수정순' },
  { value: 'episodes:desc', label: '회차 많은순' },
  { value: 'episodes:asc', label: '회차 적은순' },
]

export function ProjectFilters() {
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
      router.push(`/projects?${params.toString()}`)
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
    router.push('/projects')
  }

  const currentSort = searchParams.get('sort') || 'createdAt:desc'

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('status') ||
    (searchParams.get('sort') && searchParams.get('sort') !== 'createdAt:desc')

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="제목 또는 작성자 검색..."
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
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateFilters('status', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentSort} onValueChange={(value) => updateFilters('sort', value)}>
        <SelectTrigger className="w-40">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
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
