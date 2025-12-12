import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

export async function logAdminActivity(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  await prisma.adminActivityLog.create({
    data: {
      adminEmail,
      action,
      targetType,
      targetId,
      details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      ipAddress,
      userAgent,
    },
  })
}

// 자주 사용되는 액션 상수
export const AdminActions = {
  // 사용자 관련
  USER_VIEW: 'user.view',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_CREDIT_ADJUST: 'user.credit_adjust',
  USER_PLAN_CHANGE: 'user.plan_change',

  // 프로젝트 관련
  PROJECT_VIEW: 'project.view',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_STATUS_CHANGE: 'project.status_change',

  // 프로모션 관련
  PROMOTION_CREATE: 'promotion.create',
  PROMOTION_UPDATE: 'promotion.update',
  PROMOTION_DELETE: 'promotion.delete',

  // AI 설정 관련
  AI_RATE_CREATE: 'ai.rate_create',
  AI_RATE_UPDATE: 'ai.rate_update',
  AI_RATE_DELETE: 'ai.rate_delete',
  AI_PROVIDER_UPDATE: 'ai.provider_update',

  // 작업 관련
  JOB_UPDATE: 'job.update',
  JOB_RETRY: 'job.retry',
  JOB_CANCEL: 'job.cancel',

  // 관리자 관련
  ADMIN_CREATE: 'admin.create',
  ADMIN_UPDATE: 'admin.update',
  ADMIN_DELETE: 'admin.delete',

  // 시스템 설정 관련
  SETTING_UPDATE: 'setting.update',
} as const
