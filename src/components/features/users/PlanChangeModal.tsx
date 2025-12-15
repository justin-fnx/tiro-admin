'use client'

import { useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { SubscriptionTier } from '@prisma/client'

interface PlanChangeModalProps {
  userId: string
  currentTier: SubscriptionTier
  currentExpiry: Date | null
}

export function PlanChangeModal({ userId, currentTier, currentExpiry }: PlanChangeModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(currentTier)
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(
    currentExpiry ? new Date(currentExpiry).toISOString().split('T')[0] : ''
  )
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/users/${userId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier,
          subscriptionExpiry: subscriptionExpiry || null,
          reason,
        }),
      })

      if (res.ok) {
        setOpen(false)
        setReason('')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '플랜 변경에 실패했습니다.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('인증이 만료')) return
      alert('플랜 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          플랜 변경
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>구독 플랜 변경</DialogTitle>
            <DialogDescription>사용자의 구독 플랜을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tier">구독 플랜</Label>
              <Select
                value={subscriptionTier}
                onValueChange={(value) => setSubscriptionTier(value as SubscriptionTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry">구독 만료일</Label>
              <Input
                id="expiry"
                type="date"
                value={subscriptionExpiry}
                onChange={(e) => setSubscriptionExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">비워두면 무기한입니다.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">변경 사유</Label>
              <Textarea
                id="reason"
                placeholder="플랜 변경 사유를 입력하세요"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading || !reason}>
              {loading ? '처리 중...' : '변경하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
