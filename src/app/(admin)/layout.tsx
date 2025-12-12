import { AdminLayout } from '@/components/layouts/AdminLayout'

// Force dynamic rendering for all admin pages (they require database access)
export const dynamic = 'force-dynamic'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
