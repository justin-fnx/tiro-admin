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
import { Switch } from '@/components/ui/switch'
import { Pencil } from 'lucide-react'

interface CreditRate {
  id: string
  provider: string
  model: string
  input: number
  output: number
  isActive: boolean
}

interface EditCreditRateModalProps {
  rate: CreditRate
}

export function EditCreditRateModal({ rate }: EditCreditRateModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState(rate.input.toString())
  const [output, setOutput] = useState(rate.output.toString())
  const [isActive, setIsActive] = useState(rate.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const inputValue = parseFloat(input)
      const outputValue = parseFloat(output)

      if (isNaN(inputValue) || isNaN(outputValue)) {
        throw new Error('올바른 숫자를 입력해주세요.')
      }

      if (inputValue < 0 || outputValue < 0) {
        throw new Error('비율은 0 이상이어야 합니다.')
      }

      const response = await fetchWithAuth(`/api/ai/credit-rates/${rate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputValue,
          output: outputValue,
          isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '수정 실패')
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

  // AIDEV-NOTE: 모달이 열릴 때 현재 값으로 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setInput(rate.input.toString())
      setOutput(rate.output.toString())
      setIsActive(rate.isActive)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>크레딧 비율 수정</DialogTitle>
            <DialogDescription>
              {rate.provider} / {rate.model}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="input">입력 비율 (크레딧/1K 토큰)</Label>
              <Input
                id="input"
                type="number"
                step="0.001"
                min="0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="output">출력 비율 (크레딧/1K 토큰)</Label>
              <Input
                id="output"
                type="number"
                step="0.001"
                min="0"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성 상태</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
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
