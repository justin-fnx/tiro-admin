import { ProjectStatus, EpisodeStatus } from '@prisma/client'

export interface ProjectListItem {
  id: string
  title: string
  genre: string | null
  status: ProjectStatus
  currentEpisode: number
  targetEpisodes: number | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    email: string
    name: string | null
  }
  _count: {
    episodes: number
  }
}

export interface ProjectDetail extends ProjectListItem {
  description: string | null
  writingStyle: string | null
  settingsData: Record<string, unknown>
}

export interface EpisodeListItem {
  id: string
  episodeNumber: number
  title: string | null
  status: EpisodeStatus
  wordCount: number
  creditsUsed: number
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFilters {
  search?: string
  status?: ProjectStatus | 'all'
  userId?: string
}

export interface ProjectsResponse {
  projects: ProjectListItem[]
  total: number
  page: number
  totalPages: number
}
