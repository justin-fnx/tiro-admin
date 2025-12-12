import { AsyncJobType, AsyncJobStatus } from '@prisma/client'

export interface JobListItem {
  id: string
  userId: string
  projectId: string | null
  episodeId: string | null
  jobType: AsyncJobType
  status: AsyncJobStatus
  progress: number
  error: string | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  creditsUsed: number
  user: {
    email: string
    name: string | null
  }
  project: {
    title: string
  } | null
}

export interface JobDetail extends JobListItem {
  input: Record<string, unknown>
  result: Record<string, unknown> | null
  timeout: number | null
  estimatedDuration: number | null
}

export interface JobFilters {
  status?: AsyncJobStatus | 'all'
  jobType?: AsyncJobType | 'all'
  userId?: string
}

export interface JobsResponse {
  jobs: JobListItem[]
  total: number
  page: number
  totalPages: number
}

export interface JobStats {
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
}
