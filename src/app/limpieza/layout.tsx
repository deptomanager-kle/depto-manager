import DashboardShell from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default function LimpiezaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell basePath="/limpieza" role="limpieza">
      {children}
    </DashboardShell>
  )
}
