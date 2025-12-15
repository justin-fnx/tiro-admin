'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, Download } from 'lucide-react'
import { useState, useCallback } from 'react'

export function TransactionFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.set('page', '1')
      router.push(`/credits?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    if (startDate) {
      params.set('startDate', startDate)
    } else {
      params.delete('startDate')
    }
    if (endDate) {
      params.set('endDate', endDate)
    } else {
      params.delete('endDate')
    }
    params.set('page', '1')
    router.push(`/credits?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    router.push('/credits')
  }

  const handleExport = async () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    params.delete('limit')

    try {
      const response = await fetchWithAuth(`/api/transactions/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증이 만료')) return
      console.error('Export failed:', error)
    }
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('type') ||
    searchParams.get('creditType') ||
    searchParams.get('startDate') ||
    searchParams.get('endDate')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="이메일, 이름, 설명 검색..."
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
          <SelectTrigger className="w-36">
            <SelectValue placeholder="거래 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="PURCHASE">구매</SelectItem>
            <SelectItem value="USAGE">사용</SelectItem>
            <SelectItem value="BONUS">보너스</SelectItem>
            <SelectItem value="REFUND">환불</SelectItem>
            <SelectItem value="INITIAL_CREDIT">초기 지급</SelectItem>
            <SelectItem value="SUBSCRIPTION">구독</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('creditType') || 'all'}
          onValueChange={(value) => updateFilters('creditType', value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="크레딧 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 크레딧</SelectItem>
            <SelectItem value="CHARGED">충전</SelectItem>
            <SelectItem value="SUBSCRIPTION">구독</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            필터 초기화
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">기간:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground">~</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}
