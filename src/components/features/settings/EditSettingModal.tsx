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
import { Pencil } from 'lucide-react'

interface Setting {
  key: string
  value: unknown
  description: string | null
}

interface EditSettingModalProps {
  setting: Setting
}

export function EditSettingModal({ setting }: EditSettingModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2))
  const [description, setDescription] = useState(setting.description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
          key: setting.key,
          value: parsedValue,
          description: description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '설정 수정 실패')
      }

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
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>설정 수정</DialogTitle>
            <DialogDescription className="font-mono">{setting.key}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="value">값 (JSON)</Label>
              <textarea
                id="value"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">JSON 형식으로 입력하세요.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                placeholder="설정에 대한 설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
