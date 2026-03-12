'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Booking } from '@/lib/types'
import {
  Plus,
  Search,
  Calendar,
  Loader2,
  X,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  User,
  Clock,
} from 'lucide-react'

export default function ReservasPage() {
  const { profile } = useProfile()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [deptos, setDeptos] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [bookingsRes, deptosRes] = await Promise.all([
      supabase.from('bookings').select('*, deptos(name)').order('check_in', { ascending: false }),
      supabase.from('deptos').select('id, name').eq('is_active', true).order('name'),
    ])
    setBookings(bookingsRes.data || [])
    setDeptos(deptosRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = bookings.filter((b) => {
    const matchSearch = b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.depto as any)?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCheckIn = async (booking: Booking) => {
    await supabase.from('bookings').update({
      status: 'active',
      checked_in_at: new Date().toISOString(),
      checked_in_by: profile?.id,
    }).eq('id', booking.id)
    fetchData()
  }

  const handleCheckOut = async (booking: Booking) => {
    await supabase.from('bookings').update({
      status: 'completed',
      checked_out_at: new Date().toISOString(),
      checked_out_by: profile?.id,
    }).eq('id', booking.id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva?')) return
    await supabase.from('bookings').delete().eq('id', id)
    fetchData()
  }

  const statusLabel: Record<string, string> = { upcoming: 'Próxima', active: 'Activa', completed: 'Completada', cancelled: 'Cancelada' }
  const statusClass: Record<string, string> = { upcoming: 'badge-pending', active: 'badge-active', completed: 'badge-completed', cancelled: 'badge-cancelled' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-surface-600 text-sm mt-1">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditingBooking(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nueva Reserva
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-11" placeholder="Buscar huésped o depto..." />
        </div>
        <div className="flex gap-2">
          {['all', 'upcoming', 'active', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20' : 'text-surface-600 hover:text-white hover:bg-surface-300 border border-transparent'
              }`}
            >
              {s === 'all' ? 'Todas' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin reservas</h3>
          <p className="text-surface-600 text-sm">Agrega la primera reserva</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => (
            <div key={booking.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-300 flex items-center justify-center">
                    <User size={20} className="text-surface-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{booking.guest_name}</h3>
                    <p className="text-sm text-surface-600">{(booking as any).deptos?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusClass[booking.status]}`}>{statusLabel[booking.status]}</span>
                  <div className="flex gap-1">
                    {booking.status === 'upcoming' && (
                      <button onClick={() => handleCheckIn(booking)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Check-In">
                        <LogIn size={15} />
                      </button>
                    )}
                    {booking.status === 'active' && (
                      <button onClick={() => handleCheckOut(booking)} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Check-Out">
                        <LogOut size={15} />
                      </button>
                    )}
                    <button onClick={() => { setEditingBooking(booking); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-white transition-colors">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(booking.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-surface-700">
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-surface-600" />{booking.check_in} → {booking.check_out}</div>
                <div className="flex items-center gap-1.5"><Clock size={14} className="text-surface-600" />{booking.total_nights} noches</div>
                {booking.total_amount && <div className="text-accent-teal font-medium">${booking.total_amount.toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BookingFormModal
          booking={editingBooking}
          deptos={deptos}
          onClose={() => { setShowForm(false); setEditingBooking(null) }}
          onSaved={() => { setShowForm(false); setEditingBooking(null); fetchData() }}
        />
      )}
    </div>
  )
}

function BookingFormModal({ booking, deptos, onClose, onSaved }: {
  booking: Booking | null
  deptos: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    depto_id: booking?.depto_id || '',
    guest_name: booking?.guest_name || '',
    guest_phone: booking?.guest_phone || '',
    guest_email: booking?.guest_email || '',
    check_in: booking?.check_in || '',
    check_out: booking?.check_out || '',
    total_amount: booking?.total_amount?.toString() || '',
    airbnb_fee: booking?.airbnb_fee?.toString() || '',
    notes: booking?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const totalNights = (() => {
    if (!form.check_in || !form.check_out) return 0
    const diff = new Date(form.check_out).getTime() - new Date(form.check_in).getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      depto_id: form.depto_id,
      guest_name: form.guest_name,
      guest_phone: form.guest_phone || null,
      guest_email: form.guest_email || null,
      check_in: form.check_in,
      check_out: form.check_out,
      total_nights: totalNights,
      total_amount: form.total_amount ? parseFloat(form.total_amount) : null,
      airbnb_fee: form.airbnb_fee ? parseFloat(form.airbnb_fee) : null,
      notes: form.notes || null,
    }
    if (booking) {
      await supabase.from('bookings').update(payload).eq('id', booking.id)
    } else {
      await supabase.from('bookings').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const u = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-100 border border-surface-400/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-surface-100 border-b border-surface-400/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-white">{booking ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Departamento *</label>
            <select value={form.depto_id} onChange={(e) => u('depto_id', e.target.value)} className="input-base" required>
              <option value="">Seleccionar...</option>
              {deptos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Huésped *</label>
            <input value={form.guest_name} onChange={(e) => u('guest_name', e.target.value)} className="input-base" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Teléfono</label>
              <input value={form.guest_phone} onChange={(e) => u('guest_phone', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Email</label>
              <input type="email" value={form.guest_email} onChange={(e) => u('guest_email', e.target.value)} className="input-base" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Check-In *</label>
              <input type="date" value={form.check_in} onChange={(e) => u('check_in', e.target.value)} className="input-base" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Check-Out *</label>
              <input type="date" value={form.check_out} onChange={(e) => u('check_out', e.target.value)} className="input-base" required />
            </div>
          </div>
          {totalNights > 0 && <p className="text-sm text-surface-700">{totalNights} noche{totalNights !== 1 ? 's' : ''}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Monto Total ($)</label>
              <input type="number" step="0.01" value={form.total_amount} onChange={(e) => u('total_amount', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Comisión Airbnb ($)</label>
              <input type="number" step="0.01" value={form.airbnb_fee} onChange={(e) => u('airbnb_fee', e.target.value)} className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={(e) => u('notes', e.target.value)} className="input-base min-h-[60px] resize-y" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {booking ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
