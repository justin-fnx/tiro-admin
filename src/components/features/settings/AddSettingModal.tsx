'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import {
  SettingType,
  DEFAULT_VALUES,
  SETTING_TYPE_LABELS,
} from '@/lib/constants/setting-types'

// AIDEV-NOTE: 새로운 시스템 설정을 추가하는 모달
// 설정 타입 선택 시 해당 타입에 맞는 기본값이 설정됨

export function AddSettingModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [key, setKey] = useState('')
  const [settingType, setSettingType] = useState<SettingType>(SettingType.JSON)
  const [value, setValue] = useState(JSON.stringify(DEFAULT_VALUES[SettingType.JSON], null, 2))
  const [description, setDescription] = useState('')

  const handleTypeChange = (type: SettingType) => {
    setSettingType(type)
    setValue(JSON.stringify(DEFAULT_VALUES[type], null, 2))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 키 형식 검증 (대문자, 숫자, 언더스코어만 허용)
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        throw new Error('키는 대문자로 시작하고, 대문자/숫자/언더스코어만 사용 가능합니다.')
      }

      let parsedValue: unknown
      try {
        parsedValue = JSON.parse(value)
      } catch {
        throw new Error('올바른 JSON 형식이 아닙니다.')
      }

      const response = await fetchWithAuth('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: parsedValue,
          description: description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '설정 추가 실패')
      }

      // 초기화
      setKey('')
      setSettingType(SettingType.JSON)
      setValue(JSON.stringify(DEFAULT_VALUES[SettingType.JSON], null, 2))
      setDescription('')
      setOpen(false)
      router.refresh()
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증이 만료')) return
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          설정 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 설정 추가</DialogTitle>
            <DialogDescription>
              새로운 시스템 설정을 추가합니다. 키는 대문자와 언더스코어로 작성하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="key">설정 키</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="NEW_SETTING_KEY"
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  예: SITE_NAME, MAX_UPLOAD_SIZE
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">설정 타입</Label>
                <Select value={settingType} onValueChange={(v) => handleTypeChange(v as SettingType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SETTING_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 설정에 대한 설명"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">값 (JSON)</Label>
              <textarea
                id="value"
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                타입에 따른 기본 구조가 제공됩니다. 필요에 맞게 수정하세요.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
