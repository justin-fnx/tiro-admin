import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd HH:mm', { locale: ko })
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd', { locale: ko })
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ko })
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('ko-KR').format(num)
}

export function formatCredits(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('ko-KR').format(num) + ' 크레딧'
}

export function formatPercent(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined) return '-'
  return num.toFixed(decimals) + '%'
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
