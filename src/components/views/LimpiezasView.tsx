'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { CleaningJob } from '@/lib/types'
import {
  Plus, Search, SprayCan, Loader2, X, Clock, MapPin,
  CheckCircle2, Play, Camera, DollarSign, AlertTriangle,
} from 'lucide-react'

export default function LimpiezasPage() {
  const { profile } = useProfile()
  const [jobs, setJobs] = useState<CleaningJob[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [deptos, setDeptos] = useState<{ id: string; name: string; address: string }[]>([])
  const [cleaners, setCleaners] = useState<{ id: string; full_name: string; hourly_rate: number | null }[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [jobsRes, deptRes, cleanRes] = await Promise.all([
      supabase.from('cleaning_jobs').select('*, deptos(name, address), assignee:assigned_to(full_name, hourly_rate), assigner:assigned_by(full_name)')
        .order('scheduled_date', { ascending: false }),
      supabase.from('deptos').select('id, name, address').eq('is_active', true),
      supabase.from('profiles').select('id, full_name, hourly_rate').eq('role', 'limpieza').eq('is_active', true),
    ])
    setJobs(jobsRes.data || [])
    setDeptos(deptRes.data || [])
    setCleaners(cleanRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = jobs.filter((j) => statusFilter === 'all' || j.status === statusFilter)

  const statusLabel: Record<string, string> = { pending: 'Pendiente', accepted: 'Aceptada', in_progress: 'En Progreso', completed: 'Completada', verified: 'Verificada', cancelled: 'Cancelada' }
  const statusClass: Record<string, string> = { pending: 'badge-pending', accepted: 'badge-active', in_progress: 'badge-urgent', completed: 'badge-completed', verified: 'bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20', cancelled: 'badge-cancelled' }

  // PL actions
  const handleAccept = async (jobId: string) => {
    await supabase.from('cleaning_jobs').update({ status: 'accepted', accepted_at: new Date().toISOString(), assigned_to: profile?.id }).eq('id', jobId)
    fetchData()
  }

  const handleStartCleaning = async (jobId: string) => {
    await supabase.from('cleaning_jobs').update({ status: 'in_progress', check_in_at: new Date().toISOString() }).eq('id', jobId)
    fetchData()
  }

  const handleFinishCleaning = async (jobId: string) => {
    const checkOutAt = new Date().toISOString()
    const job = jobs.find((j) => j.id === jobId)
    const checkInAt = job?.check_in_at ? new Date(job.check_in_at) : new Date()
    const timeSpent = Math.round((new Date(checkOutAt).getTime() - checkInAt.getTime()) / 60000)

    await supabase.from('cleaning_jobs').update({
      status: 'completed',
      check_out_at: checkOutAt,
      time_spent_min: timeSpent,
    }).eq('id', jobId)
    fetchData()
  }

  const handleVerify = async (jobId: string) => {
    await supabase.from('cleaning_jobs').update({ status: 'verified' }).eq('id', jobId)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Limpiezas</h1>
          <p className="text-surface-600 text-sm mt-1">{jobs.length} trabajo{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'subadmin') && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Asignar Limpieza
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'accepted', 'in_progress', 'completed', 'verified'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === s ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20' : 'text-surface-600 hover:text-white hover:bg-surface-300 border border-transparent'
            }`}
          >
            {s === 'all' ? 'Todas' : statusLabel[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <SprayCan size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin limpiezas</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => (
            <div key={job.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    job.priority === 'urgent' ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-violet-500/10 border border-violet-500/20'
                  }`}>
                    {job.priority === 'urgent' ? <AlertTriangle size={20} className="text-rose-400" /> : <SprayCan size={20} className="text-violet-400" />}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{(job as any).deptos?.name}</h3>
                    <p className="text-sm text-surface-600 flex items-center gap-1">
                      <MapPin size={12} />{(job as any).deptos?.address}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-surface-700">
                      <span className="flex items-center gap-1"><Clock size={13} />{job.scheduled_date} {job.scheduled_time}</span>
                      {(job as any).assignee?.full_name && <span>Asignado: {(job as any).assignee.full_name}</span>}
                      {job.time_spent_min && <span>{job.time_spent_min} min</span>}
                      {job.tip_percentage && job.tip_percentage > 0 && <span className="text-accent-amber">+{job.tip_percentage}% propina</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${statusClass[job.status]}`}>
                    {job.priority === 'urgent' && '🔥 '}{statusLabel[job.status]}
                  </span>
                  {/* PL actions */}
                  {profile?.role === 'limpieza' && job.status === 'pending' && (
                    <button onClick={() => handleAccept(job.id)} className="btn-primary text-xs px-3 py-1.5">Aceptar</button>
                  )}
                  {profile?.role === 'limpieza' && job.status === 'accepted' && (
                    <button onClick={() => handleStartCleaning(job.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Iniciar">
                      <Play size={15} />
                    </button>
                  )}
                  {profile?.role === 'limpieza' && job.status === 'in_progress' && (
                    <button onClick={() => handleFinishCleaning(job.id)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Finalizar">
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  {/* SA/Admin verify */}
                  {(profile?.role === 'admin' || profile?.role === 'subadmin') && job.status === 'completed' && (
                    <button onClick={() => handleVerify(job.id)} className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors" title="Verificar">
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CleaningFormModal
          deptos={deptos}
          cleaners={cleaners}
          profileId={profile?.id || ''}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData() }}
        />
      )}
    </div>
  )
}

function CleaningFormModal({ deptos, cleaners, profileId, onClose, onSaved }: {
  deptos: { id: string; name: string; address: string }[]
  cleaners: { id: string; full_name: string; hourly_rate: number | null }[]
  profileId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    depto_id: '',
    assigned_to: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    priority: 'normal',
    tip_percentage: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('cleaning_jobs').insert({
      depto_id: form.depto_id,
      assigned_by: profileId,
      assigned_to: form.assigned_to || null,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || null,
      priority: form.priority,
      tip_percentage: form.tip_percentage ? parseFloat(form.tip_percentage) : 0,
    })
    setSaving(false)
    onSaved()
  }

  const u = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-100 border border-surface-400/50 rounded-2xl w-full max-w-md animate-scale-in">
        <div className="border-b border-surface-400/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Asignar Limpieza</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Departamento *</label>
            <select value={form.depto_id} onChange={(e) => u('depto_id', e.target.value)} className="input-base" required>
              <option value="">Seleccionar...</option>
              {deptos.map((d) => <option key={d.id} value={d.id}>{d.name} - {d.address}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Asignar a (opcional)</label>
            <select value={form.assigned_to} onChange={(e) => u('assigned_to', e.target.value)} className="input-base">
              <option value="">Sin asignar (abierto)</option>
              {cleaners.map((c) => <option key={c.id} value={c.id}>{c.full_name} {c.hourly_rate ? `($${c.hourly_rate}/h)` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Fecha *</label>
              <input type="date" value={form.scheduled_date} onChange={(e) => u('scheduled_date', e.target.value)} className="input-base" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Hora</label>
              <input type="time" value={form.scheduled_time} onChange={(e) => u('scheduled_time', e.target.value)} className="input-base" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Prioridad</label>
              <select value={form.priority} onChange={(e) => u('priority', e.target.value)} className="input-base">
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Propina %</label>
              <input type="number" min="0" max="100" value={form.tip_percentage} onChange={(e) => u('tip_percentage', e.target.value)} className="input-base" placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
