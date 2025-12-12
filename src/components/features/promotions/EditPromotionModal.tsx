'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Switch } from '@/components/ui/switch'
import { Pencil } from 'lucide-react'

interface PromotionCode {
  id: string
  code: string
  creditAmount: number
  quota: number | null
  description: string | null
  expiresAt: string | null
  isActive: boolean
}

interface EditPromotionModalProps {
  promotion: PromotionCode
}

export function EditPromotionModal({ promotion }: EditPromotionModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    creditAmount: promotion.creditAmount.toString(),
    quota: promotion.quota?.toString() || '',
    description: promotion.description || '',
    expiresAt: promotion.expiresAt ? new Date(promotion.expiresAt).toISOString().slice(0, 16) : '',
    isActive: promotion.isActive,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditAmount: parseInt(formData.creditAmount),
          quota: formData.quota ? parseInt(formData.quota) : null,
          description: formData.description || null,
          expiresAt: formData.expiresAt || null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '프로모션 코드 수정 실패')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>프로모션 코드 수정</DialogTitle>
            <DialogDescription>코드: {promotion.code}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="creditAmount">크레딧 지급량</Label>
              <Input
                id="creditAmount"
                type="number"
                value={formData.creditAmount}
                onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quota">사용 제한</Label>
              <Input
                id="quota"
                type="number"
                placeholder="무제한"
                value={formData.quota}
                onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                placeholder="설명 없음"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">만료일</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성화</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
