import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { AdminRole } from '@prisma/client'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentAdmin() {
  const session = await getSession()
  return session?.user
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return null
  }
  return admin
}

export async function requireSuperAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== AdminRole.SUPER_ADMIN) {
    return null
  }
  return admin
}
