'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import Sidebar from '@/components/dashboard/Sidebar'
import type { UserRole } from '@/lib/types'

interface DashboardShellProps {
  basePath: string
  role: UserRole
  children: React.ReactNode
}

export default function DashboardShell({ basePath, role, children }: DashboardShellProps) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar basePath={basePath} role={role} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
