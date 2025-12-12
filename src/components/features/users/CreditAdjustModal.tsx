'use client'

import { useState } from 'react'
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

interface CreditAdjustModalProps {
  userId: string
  currentCredits: {
    chargedCredit: number
    dailyCredit: number
    weeklyCredit: number
  }
}

export function CreditAdjustModal({ userId, currentCredits }: CreditAdjustModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [creditType, setCreditType] = useState<string>('chargedCredit')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !reason) return

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount, 10),
          creditType,
          reason,
        }),
      })

      if (res.ok) {
        setOpen(false)
        setAmount('')
        setReason('')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '크레딧 조정에 실패했습니다.')
      }
    } catch {
      alert('크레딧 조정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          크레딧 조정
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>크레딧 조정</DialogTitle>
            <DialogDescription>사용자의 크레딧을 수동으로 조정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="creditType">크레딧 유형</Label>
              <Select value={creditType} onValueChange={setCreditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chargedCredit">
                    충전 크레딧 (현재: {currentCredits.chargedCredit})
                  </SelectItem>
                  <SelectItem value="dailyCredit">
                    일일 크레딧 (현재: {currentCredits.dailyCredit})
                  </SelectItem>
                  <SelectItem value="weeklyCredit">
                    주간 크레딧 (현재: {currentCredits.weeklyCredit})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">금액</Label>
              <Input
                id="amount"
                type="number"
                placeholder="양수는 지급, 음수는 차감"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">양수를 입력하면 지급, 음수를 입력하면 차감됩니다.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">사유</Label>
              <Textarea
                id="reason"
                placeholder="크레딧 조정 사유를 입력하세요"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading || !amount || !reason}>
              {loading ? '처리 중...' : '조정하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
