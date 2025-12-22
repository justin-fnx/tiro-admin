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
import { PromotionCodeType } from '@prisma/client'

export function CreatePromotionModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    type: 'PUBLIC' as PromotionCodeType,
    creditAmount: '',
    quota: '',
    description: '',
    expiresAt: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetchWithAuth('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          creditAmount: parseInt(formData.creditAmount),
          quota: formData.quota ? parseInt(formData.quota) : null,
          description: formData.description || null,
          expiresAt: formData.expiresAt || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '프로모션 코드 생성 실패')
      }

      setOpen(false)
      setFormData({
        code: '',
        type: 'PUBLIC' as PromotionCodeType,
        creditAmount: '',
        quota: '',
        description: '',
        expiresAt: '',
      })
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
          <Plus className="mr-2 h-4 w-4" />
          프로모션 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>프로모션 코드 생성</DialogTitle>
            <DialogDescription>새로운 프로모션 코드를 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">코드</Label>
              <Input
                id="code"
                placeholder="WELCOME2024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">영문, 숫자, 하이픈, 언더스코어만 사용 가능</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">타입</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PromotionCodeType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">공개 (누구나 사용 가능)</SelectItem>
                  <SelectItem value="PRIVATE">비공개 (특정 사용자만)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditAmount">크레딧 지급량</Label>
              <Input
                id="creditAmount"
                type="number"
                placeholder="1000"
                value={formData.creditAmount}
                onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quota">사용 제한 (선택)</Label>
              <Input
                id="quota"
                type="number"
                placeholder="100"
                value={formData.quota}
                onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                min="1"
              />
              <p className="text-xs text-muted-foreground">비워두면 무제한</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
                placeholder="신규 가입자 웰컴 이벤트"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">만료일 (선택)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">비워두면 무기한</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
