import DashboardShell from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default function SubadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell basePath="/subadmin" role="subadmin">
      {children}
    </DashboardShell>
  )
}
