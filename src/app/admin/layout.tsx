import DashboardShell from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell basePath="/admin" role="admin">
      {children}
    </DashboardShell>
  )
}
