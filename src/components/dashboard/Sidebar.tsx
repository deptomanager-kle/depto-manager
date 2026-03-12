'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useProfile } from '@/components/providers/AuthProvider'
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  SprayCan,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
  ClipboardList,
  User,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '', icon: <LayoutDashboard size={20} /> },
    { label: 'Departamentos', path: '/deptos', icon: <Home size={20} /> },
    { label: 'Reservas', path: '/reservas', icon: <ClipboardList size={20} /> },
    { label: 'Gastos', path: '/gastos', icon: <Receipt size={20} /> },
    { label: 'Facturas', path: '/facturas', icon: <FileText size={20} /> },
    { label: 'Limpiezas', path: '/limpiezas', icon: <SprayCan size={20} /> },
    { label: 'Sub-Admins', path: '/subadmins', icon: <UserCog size={20} /> },
    { label: 'Personal', path: '/personal', icon: <Users size={20} /> },
  ],
  subadmin: [
    { label: 'Dashboard', path: '', icon: <LayoutDashboard size={20} /> },
    { label: 'Departamentos', path: '/deptos', icon: <Home size={20} /> },
    { label: 'Reservas', path: '/reservas', icon: <ClipboardList size={20} /> },
    { label: 'Gastos', path: '/gastos', icon: <Receipt size={20} /> },
    { label: 'Limpiezas', path: '/limpiezas', icon: <SprayCan size={20} /> },
  ],
  limpieza: [
    { label: 'Dashboard', path: '', icon: <LayoutDashboard size={20} /> },
    { label: 'Mis Trabajos', path: '/mis-trabajos', icon: <SprayCan size={20} /> },
    { label: 'Mi Perfil', path: '/perfil', icon: <User size={20} /> },
  ],
}

interface SidebarProps {
  basePath: string
  role: UserRole
}

export default function Sidebar({ basePath, role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useProfile()
  const router = useRouter()
  const pathname = usePathname()

  const navItems = NAV_BY_ROLE[role]

  const handleNavigation = (path: string) => {
    router.push(`${basePath}${path}`)
    setIsOpen(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administrador',
    subadmin: 'Sub-Admin',
    limpieza: 'Limpieza',
  }

  const roleColor: Record<UserRole, string> = {
    admin: 'text-brand-400',
    subadmin: 'text-accent-teal',
    limpieza: 'text-accent-amber',
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-surface-200 border border-surface-400 text-white hover:bg-surface-300 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-40 h-full w-[280px] bg-surface-50 border-r border-surface-400/50
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-surface-400/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Depto<span className="text-gradient">Mgr</span>
              </h1>
              <p className="text-[11px] text-surface-600 font-medium tracking-wide uppercase">
                Gestión Airbnb
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const fullHref = `${basePath}${item.path}`
            const isActive =
              pathname === fullHref ||
              (item.path !== '' && pathname.startsWith(fullHref))

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                      : 'text-surface-700 hover:text-white hover:bg-surface-200 border border-transparent'
                  }
                `}
              >
                <span
                  className={`transition-colors ${
                    isActive ? 'text-brand-400' : 'text-surface-600 group-hover:text-surface-800'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-brand-400/60" />}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-400/50">
          {/* Notifications */}
          <button
            onClick={() => handleNavigation('/notificaciones')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-2 ${
              pathname.includes('/notificaciones')
                ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                : 'text-surface-700 hover:text-white hover:bg-surface-200 border border-transparent'
            }`}
          >
            <Bell size={18} className={pathname.includes('/notificaciones') ? 'text-brand-400' : 'text-surface-600'} />
            <span>Notificaciones</span>
          </button>

          {/* Profile card */}
          {profile && (
            <div className="bg-surface-200/50 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center text-sm font-bold text-white">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile.full_name || 'Usuario'}
                  </p>
                  <p className={`text-[11px] font-medium ${roleColor[profile.role]}`}>
                    {roleLabel[profile.role]}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
