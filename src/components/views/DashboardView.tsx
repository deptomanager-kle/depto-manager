'use client'

import { useEffect, useState } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import {
  Home,
  Users,
  DollarSign,
  TrendingUp,
  SprayCan,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  Building2,
  Percent,
} from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
  color: string
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useProfile()
  const [stats, setStats] = useState<StatCard[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [pendingCleanings, setPendingCleanings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile) return
    loadDashboardData()
  }, [profile])

  const loadDashboardData = async () => {
    setLoading(true)

    if (profile?.role === 'admin') {
      await loadAdminData()
    } else if (profile?.role === 'subadmin') {
      await loadSubadminData()
    } else {
      await loadLimpiezaData()
    }

    setLoading(false)
  }

  const loadAdminData = async () => {
    const [deptos, bookings, expenses, cleanings, invoices, subadmins] = await Promise.all([
      supabase.from('deptos').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('bookings').select('id, total_amount, status'),
      supabase.from('expenses').select('id, amount, expense_date').gte(
        'expense_date',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
      supabase.from('cleaning_jobs').select('id, status').in('status', ['pending', 'accepted', 'in_progress']),
      supabase.from('invoices').select('id, amount').eq('is_paid', false),
      supabase.from('profiles').select('id').eq('role', 'subadmin').eq('is_active', true),
    ])

    const activeBookings = bookings.data?.filter((b) => b.status === 'active') || []
    const totalRevenue = bookings.data
      ?.filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
    const totalExpenses = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const totalUnpaid = invoices.data?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0

    const totalDeptos = deptos.count || 0
    const occupancy = totalDeptos > 0 ? Math.round((activeBookings.length / totalDeptos) * 100) : 0

    setStats([
      {
        label: 'Departamentos',
        value: totalDeptos,
        icon: <Home size={22} />,
        color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
      },
      {
        label: 'Reservas Activas',
        value: activeBookings.length,
        icon: <Calendar size={22} />,
        color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
      },
      {
        label: 'Ingresos del Mes',
        value: `$${totalRevenue.toLocaleString()}`,
        icon: <TrendingUp size={22} />,
        trend: { value: '+12%', positive: true },
        color: 'from-teal-500/20 to-teal-600/5 border-teal-500/20',
      },
      {
        label: 'Gastos del Mes',
        value: `$${totalExpenses.toLocaleString()}`,
        icon: <DollarSign size={22} />,
        color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
      },
      {
        label: 'Limpiezas Pendientes',
        value: cleanings.data?.length || 0,
        icon: <SprayCan size={22} />,
        color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
      },
      {
        label: 'Ocupación',
        value: `${occupancy}%`,
        icon: <Percent size={22} />,
        color: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
      },
      {
        label: 'Facturas Pendientes',
        value: `$${totalUnpaid.toLocaleString()}`,
        icon: <FileText size={22} />,
        color: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
      },
      {
        label: 'Sub-Admins Activos',
        value: subadmins.data?.length || 0,
        icon: <Users size={22} />,
        color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
      },
    ])

    // Recent bookings
    const { data: recent } = await supabase
      .from('bookings')
      .select('*, deptos(name)')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentBookings(recent || [])

    // Pending cleanings
    const { data: pending } = await supabase
      .from('cleaning_jobs')
      .select('*, deptos(name, address)')
      .in('status', ['pending', 'accepted'])
      .order('scheduled_date', { ascending: true })
      .limit(5)
    setPendingCleanings(pending || [])
  }

  const loadSubadminData = async () => {
    const { data: assignments } = await supabase
      .from('depto_assignments')
      .select('depto_id')
      .eq('subadmin_id', profile!.id)

    const deptoIds = assignments?.map((a) => a.depto_id) || []

    if (deptoIds.length === 0) {
      setStats([
        {
          label: 'Deptos Asignados',
          value: 0,
          icon: <Home size={22} />,
          color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
        },
      ])
      return
    }

    const [bookings, cleanings, expenses] = await Promise.all([
      supabase.from('bookings').select('id, status').in('depto_id', deptoIds),
      supabase.from('cleaning_jobs').select('id, status').in('depto_id', deptoIds).in('status', ['pending', 'accepted', 'in_progress']),
      supabase.from('expenses').select('id, amount').in('depto_id', deptoIds).eq('is_reimbursed', false),
    ])

    const activeBookings = bookings.data?.filter((b) => b.status === 'active') || []
    const unreimbursed = expenses.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    setStats([
      {
        label: 'Deptos Asignados',
        value: deptoIds.length,
        icon: <Home size={22} />,
        color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
      },
      {
        label: 'Reservas Activas',
        value: activeBookings.length,
        icon: <Calendar size={22} />,
        color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
      },
      {
        label: 'Limpiezas Pendientes',
        value: cleanings.data?.length || 0,
        icon: <SprayCan size={22} />,
        color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
      },
      {
        label: 'Gastos por Reembolsar',
        value: `$${unreimbursed.toLocaleString()}`,
        icon: <DollarSign size={22} />,
        color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
      },
    ])

    const { data: recent } = await supabase
      .from('bookings')
      .select('*, deptos(name)')
      .in('depto_id', deptoIds)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentBookings(recent || [])

    const { data: pending } = await supabase
      .from('cleaning_jobs')
      .select('*, deptos(name, address)')
      .in('depto_id', deptoIds)
      .in('status', ['pending', 'accepted'])
      .order('scheduled_date', { ascending: true })
      .limit(5)
    setPendingCleanings(pending || [])
  }

  const loadLimpiezaData = async () => {
    const [assigned, completed] = await Promise.all([
      supabase
        .from('cleaning_jobs')
        .select('id, status, scheduled_date, deptos(name, address)')
        .eq('assigned_to', profile!.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('scheduled_date', { ascending: true }),
      supabase
        .from('cleaning_jobs')
        .select('id, payment_amount, is_paid')
        .eq('assigned_to', profile!.id)
        .eq('status', 'completed'),
    ])

    const totalEarned = completed.data
      ?.filter((c) => c.is_paid)
      .reduce((sum, c) => sum + (c.payment_amount || 0), 0) || 0
    const pendingPayment = completed.data
      ?.filter((c) => !c.is_paid)
      .reduce((sum, c) => sum + (c.payment_amount || 0), 0) || 0

    setStats([
      {
        label: 'Trabajos Pendientes',
        value: assigned.data?.length || 0,
        icon: <SprayCan size={22} />,
        color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
      },
      {
        label: 'Trabajos Completados',
        value: completed.data?.length || 0,
        icon: <Clock size={22} />,
        color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
      },
      {
        label: 'Total Ganado',
        value: `$${totalEarned.toLocaleString()}`,
        icon: <DollarSign size={22} />,
        color: 'from-teal-500/20 to-teal-600/5 border-teal-500/20',
      },
      {
        label: 'Pago Pendiente',
        value: `$${pendingPayment.toLocaleString()}`,
        icon: <DollarSign size={22} />,
        color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
      },
    ])

    setPendingCleanings(assigned.data || [])
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-400 mx-auto mb-3" />
          <p className="text-surface-600 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const statusLabel: Record<string, string> = {
    upcoming: 'Próxima',
    active: 'Activa',
    completed: 'Completada',
    cancelled: 'Cancelada',
    pending: 'Pendiente',
    accepted: 'Aceptada',
    in_progress: 'En Progreso',
  }

  const statusClass: Record<string, string> = {
    upcoming: 'badge-pending',
    active: 'badge-active',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    pending: 'badge-pending',
    accepted: 'badge-active',
    in_progress: 'badge-urgent',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {greeting()},{' '}
          <span className="text-gradient">
            {profile?.full_name?.split(' ')[0] || 'Usuario'}
          </span>
        </h1>
        <p className="text-surface-600 mt-1 text-sm">
          {profile?.role === 'admin' && 'Resumen general de todos tus departamentos'}
          {profile?.role === 'subadmin' && 'Resumen de tus departamentos asignados'}
          {profile?.role === 'limpieza' && 'Tus trabajos de limpieza'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${stat.color} card-hover`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-700 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                {stat.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend.positive ? (
                      <ArrowUpRight size={14} className="text-emerald-400" />
                    ) : (
                      <ArrowDownRight size={14} className="text-red-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stat.trend.positive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {stat.trend.value}
                    </span>
                    <span className="text-xs text-surface-600">vs mes anterior</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        {recentBookings.length > 0 && (
          <div className="bg-surface-100 border border-surface-400/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Reservas Recientes</h2>
              <Calendar size={18} className="text-surface-600" />
            </div>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-200/50 hover:bg-surface-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center">
                      <Building2 size={16} className="text-surface-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {booking.guest_name}
                      </p>
                      <p className="text-xs text-surface-600 truncate">
                        {booking.deptos?.name}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${statusClass[booking.status] || 'badge-pending'}`}>
                    {statusLabel[booking.status] || booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending cleanings */}
        {pendingCleanings.length > 0 && (
          <div className="bg-surface-100 border border-surface-400/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Limpiezas Pendientes</h2>
              <SprayCan size={18} className="text-surface-600" />
            </div>
            <div className="space-y-3">
              {pendingCleanings.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-200/50 hover:bg-surface-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-300 flex items-center justify-center">
                      <SprayCan size={16} className="text-surface-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {job.deptos?.name}
                      </p>
                      <p className="text-xs text-surface-600">
                        {job.scheduled_date} {job.scheduled_time && `• ${job.scheduled_time}`}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${job.priority === 'urgent' ? 'badge-urgent' : statusClass[job.status] || 'badge-pending'}`}>
                    {job.priority === 'urgent' ? 'Urgente' : statusLabel[job.status] || job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recentBookings.length === 0 && pendingCleanings.length === 0 && (
          <div className="lg:col-span-2 bg-surface-100 border border-surface-400/50 rounded-2xl p-12 text-center">
            <Building2 size={48} className="text-surface-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              ¡Bienvenido a DeptoManager!
            </h3>
            <p className="text-surface-600 text-sm max-w-md mx-auto">
              Comienza agregando departamentos, sub-administradores y personal para gestionar todo desde aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
