'use client'

import { useState } from 'react'
import { EpisodeStatus } from '@prisma/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { EpisodeDetailModal } from './EpisodeDetailModal'

// AIDEV-NOTE: 회차 목록 테이블 - 클릭 시 상세 모달 표시
interface Episode {
  id: string
  episodeNumber: number
  title: string | null
  status: EpisodeStatus
  wordCount: number
  creditsUsed: number
  createdAt: Date
}

interface EpisodeTableProps {
  episodes: Episode[]
}

const episodeStatusLabels: Record<EpisodeStatus, string> = {
  DRAFT: '초안',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  PUBLISHED: '발행',
  ARCHIVED: '보관',
}

export function EpisodeTable({ episodes }: EpisodeTableProps) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleEpisodeClick = (episodeId: string) => {
    setSelectedEpisodeId(episodeId)
    setModalOpen(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>회차</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">글자 수</TableHead>
            <TableHead className="text-right">크레딧</TableHead>
            <TableHead>생성일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {episodes.map((episode) => (
            <TableRow
              key={episode.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleEpisodeClick(episode.id)}
            >
              <TableCell className="font-medium">{episode.episodeNumber}화</TableCell>
              <TableCell className="text-primary hover:underline">
                {episode.title || '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{episodeStatusLabels[episode.status]}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatNumber(episode.wordCount)}</TableCell>
              <TableCell className="text-right">{formatNumber(episode.creditsUsed)}</TableCell>
              <TableCell>{formatDate(episode.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EpisodeDetailModal
        episodeId={selectedEpisodeId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
