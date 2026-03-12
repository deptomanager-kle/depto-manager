'use client'

import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import { useState, useEffect, useCallback } from 'react'
import type { CleaningJob } from '@/lib/types'
import {
  User, Phone, Mail, MapPin, DollarSign, Loader2, Briefcase, CheckCircle2, Clock, Star,
} from 'lucide-react'

export default function PerfilPage() {
  const { profile } = useProfile()
  const [stats, setStats] = useState({ completed: 0, pending: 0, totalEarned: 0, avgRating: 0 })
  const [recentJobs, setRecentJobs] = useState<CleaningJob[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const [completedRes, pendingRes, jobsRes] = await Promise.all([
      supabase.from('cleaning_jobs').select('payment_amount', { count: 'exact' }).eq('assigned_to', profile.id).eq('status', 'completed'),
      supabase.from('cleaning_jobs').select('id', { count: 'exact' }).eq('assigned_to', profile.id).in('status', ['pending', 'accepted', 'in_progress']),
      supabase.from('cleaning_jobs').select('*, deptos(name)').eq('assigned_to', profile.id).order('scheduled_date', { ascending: false }).limit(10),
    ])
    const totalEarned = (completedRes.data || []).reduce((s, j) => s + (j.payment_amount || 0), 0)
    setStats({
      completed: completedRes.count || 0,
      pending: pendingRes.count || 0,
      totalEarned,
      avgRating: 0,
    })
    setRecentJobs(jobsRes.data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-400" /></div>

  const STATUS_MAP: Record<string, string> = { pending: 'Pendiente', accepted: 'Aceptado', in_progress: 'En progreso', completed: 'Completado', verified: 'Verificado', cancelled: 'Cancelado' }
  const STATUS_CLASS: Record<string, string> = { pending: 'badge-pending', accepted: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20', in_progress: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20', completed: 'badge-completed', verified: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20', cancelled: 'badge-cancelled' }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

      {/* Profile Card */}
      <div className="bg-surface-100 border border-surface-400/50 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
            <p className="text-brand-400 text-sm font-medium capitalize">Personal de Limpieza</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-surface-600">
              {profile?.email && (
                <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
              )}
              {profile?.phone && (
                <span className="flex items-center gap-1.5"><Phone size={14} /> {profile.phone}</span>
              )}
              {profile?.location && (
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.location}</span>
              )}
            </div>
          </div>
          <div className="border border-surface-400/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-surface-600 mb-0.5">Tarifa/hora</p>
            <p className="text-lg font-bold text-accent-teal">${profile?.hourly_rate || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, label: 'Completados', value: stats.completed, color: 'text-accent-emerald' },
          { icon: Clock, label: 'Pendientes', value: stats.pending, color: 'text-accent-amber' },
          { icon: DollarSign, label: 'Total Ganado', value: `$${stats.totalEarned.toLocaleString()}`, color: 'text-accent-teal' },
          { icon: Star, label: 'Calificación', value: '—', color: 'text-accent-violet' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <s.icon size={20} className={`${s.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-surface-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Trabajos Recientes</h2>
        {recentJobs.length === 0 ? (
          <div className="text-center py-12 text-surface-600">
            <Briefcase size={36} className="mx-auto mb-3 text-surface-500" />
            <p>Sin trabajos aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{(job as any).deptos?.name || 'Depto'}</h3>
                  <p className="text-xs text-surface-600">{job.scheduled_date} · {job.cleaning_type === 'deep' ? 'Profunda' : job.cleaning_type === 'checkout' ? 'Checkout' : 'Regular'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {job.payment_amount != null && (
                    <span className="text-sm font-semibold text-white">${job.payment_amount}</span>
                  )}
                  <span className={`badge ${STATUS_CLASS[job.status] || 'badge-cancelled'}`}>{STATUS_MAP[job.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
