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
import { AiFeature } from '@prisma/client'
import { featureLabels } from '@/lib/constants/ai-features'

interface ProviderConfig {
  id: string
  feature: AiFeature
  provider: string
  model: string
  isActive: boolean
}

interface EditProviderConfigModalProps {
  config: ProviderConfig
}

export function EditProviderConfigModal({ config }: EditProviderConfigModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState(config.provider)
  const [model, setModel] = useState(config.model)
  const [isActive, setIsActive] = useState(config.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!provider.trim() || !model.trim()) {
        throw new Error('프로바이더와 모델명은 필수입니다.')
      }

      const response = await fetchWithAuth(`/api/ai/providers/${config.feature}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.trim(),
          model: model.trim(),
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
      setProvider(config.provider)
      setModel(config.model)
      setIsActive(config.isActive)
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
            <DialogTitle>프로바이더 설정 수정</DialogTitle>
            <DialogDescription>{featureLabels[config.feature]}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">프로바이더</Label>
              <Input
                id="provider"
                type="text"
                placeholder="예: anthropic, openai, deepinfra"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">모델</Label>
              <Input
                id="model"
                type="text"
                placeholder="예: claude-sonnet-4-20250514"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성 상태</Label>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
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
