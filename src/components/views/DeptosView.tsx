'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Depto } from '@/lib/types'
import {
  Plus,
  Search,
  Home,
  MapPin,
  Users as UsersIcon,
  DollarSign,
  Loader2,
  X,
  Edit3,
  Trash2,
  ExternalLink,
  BedDouble,
  Bath,
} from 'lucide-react'

export default function DeptosPage() {
  const { profile } = useProfile()
  const [deptos, setDeptos] = useState<Depto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDepto, setEditingDepto] = useState<Depto | null>(null)
  const supabase = createClient()

  const fetchDeptos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deptos')
      .select('*')
      .order('created_at', { ascending: false })
    setDeptos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDeptos()
  }, [fetchDeptos])

  const filteredDeptos = deptos.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este departamento? Esta acción no se puede deshacer.')) return
    await supabase.from('deptos').delete().eq('id', id)
    fetchDeptos()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Departamentos</h1>
          <p className="text-surface-600 text-sm mt-1">
            {deptos.length} departamento{deptos.length !== 1 ? 's' : ''} registrado{deptos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => { setEditingDepto(null); setShowForm(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Agregar Depto
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-11"
          placeholder="Buscar por nombre, dirección o ciudad..."
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filteredDeptos.length === 0 ? (
        <div className="text-center py-20">
          <Home size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'Sin resultados' : 'Sin departamentos'}
          </h3>
          <p className="text-surface-600 text-sm">
            {search ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer departamento para comenzar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDeptos.map((depto,i) => (
            <DeptoCard
              key={depto.id}
              depto={depto}
              isAdmin={profile?.role === 'admin'}
              onEdit={() => { setEditingDepto(depto); setShowForm(true) }}
              onDelete={() => handleDelete(depto.id)}
              delay={i * 50}
            />
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <DeptoFormModal
          depto={editingDepto}
          onClose={() => { setShowForm(false); setEditingDepto(null) }}
          onSaved={() => { setShowForm(false); setEditingDepto(null); fetchDeptos() }}
        />
      )}
    </div>
  )
}

function DeptoCard({
  depto,
  isAdmin,
  onEdit,
  onDelete,
  delay,
}: {
  depto: Depto
  isAdmin?: boolean
  onEdit: () => void
  onDelete: () => void
  delay: number
}) {
  return (
    <div
      className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
            <Home size={20} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{depto.name}</h3>
            <span className={`badge ${depto.is_active ? 'badge-active' : 'badge-cancelled'}`}>
              {depto.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-white transition-colors">
              <Edit3 size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-surface-700">
          <MapPin size={14} className="text-surface-600 flex-shrink-0" />
          <span className="truncate">{depto.address}, {depto.city}</span>
        </div>
        {depto.neighborhood && (
          <div className="flex items-center gap-2 text-surface-700">
            <Home size={14} className="text-surface-600 flex-shrink-0" />
            <span>{depto.neighborhood}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-surface-700">
          <div className="flex items-center gap-1.5">
            <BedDouble size={14} className="text-surface-600" />
            <span>{depto.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={14} className="text-surface-600" />
            <span>{depto.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UsersIcon size={14} className="text-surface-600" />
            <span>{depto.max_guests} huésp.</span>
          </div>
        </div>

        {depto.airbnb_price_per_night && (
          <div className="flex items-center gap-2 text-surface-700">
            <DollarSign size={14} className="text-accent-teal flex-shrink-0" />
            <span className="text-accent-teal font-medium">
              ${depto.airbnb_price_per_night}/noche
            </span>
          </div>
        )}
      </div>

      {/* Owner info */}
      <div className="mt-4 pt-3 border-t border-surface-400/30">
        <p className="text-xs text-surface-600">
          Propietario: <span className="text-surface-800">{depto.owner_name}</span>
          {depto.owner_percentage ? ` • ${depto.owner_percentage}%` : ''}
        </p>
      </div>

      {depto.airbnb_url && (
        <a
          href={depto.airbnb_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          <ExternalLink size={12} />
          Ver en Airbnb
        </a>
      )}
    </div>
  )
}

function DeptoFormModal({
  depto,
  onClose,
  onSaved,
}: {
  depto: Depto | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: depto?.name || '',
    address: depto?.address || '',
    city: depto?.city || '',
    neighborhood: depto?.neighborhood || '',
    airbnb_url: depto?.airbnb_url || '',
    airbnb_price_per_night: depto?.airbnb_price_per_night?.toString() || '',
    owner_name: depto?.owner_name || '',
    owner_phone: depto?.owner_phone || '',
    owner_email: depto?.owner_email || '',
    owner_percentage: depto?.owner_percentage?.toString() || '',
    bedrooms: depto?.bedrooms?.toString() || '1',
    bathrooms: depto?.bathrooms?.toString() || '1',
    max_guests: depto?.max_guests?.toString() || '2',
    avg_cleaning_time_min: depto?.avg_cleaning_time_min?.toString() || '',
    notes: depto?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      neighborhood: form.neighborhood || null,
      airbnb_url: form.airbnb_url || null,
      airbnb_price_per_night: form.airbnb_price_per_night ? parseFloat(form.airbnb_price_per_night) : null,
      owner_name: form.owner_name,
      owner_phone: form.owner_phone || null,
      owner_email: form.owner_email || null,
      owner_percentage: form.owner_percentage ? parseFloat(form.owner_percentage) : null,
      bedrooms: parseInt(form.bedrooms) || 1,
      bathrooms: parseInt(form.bathrooms) || 1,
      max_guests: parseInt(form.max_guests) || 2,
      avg_cleaning_time_min: form.avg_cleaning_time_min ? parseInt(form.avg_cleaning_time_min) : null,
      notes: form.notes || null,
    }

    if (depto) {
      await supabase.from('deptos').update(payload).eq('id', depto.id)
    } else {
      await supabase.from('deptos').insert(payload)
    }

    setSaving(false)
    onSaved()
  }

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-100 border border-surface-400/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-surface-100 border-b border-surface-400/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-white">
            {depto ? 'Editar Departamento' : 'Nuevo Departamento'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info básica */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-surface-800 mb-2">Información Básica</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Nombre *</label>
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="input-base" placeholder="Depto Centro 1A" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Dirección *</label>
                <input value={form.address} onChange={(e) => updateField('address', e.target.value)} className="input-base" placeholder="Av. Corrientes 1234, Piso 5" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Ciudad *</label>
                <input value={form.city} onChange={(e) => updateField('city', e.target.value)} className="input-base" placeholder="Buenos Aires" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Barrio</label>
                <input value={form.neighborhood} onChange={(e) => updateField('neighborhood', e.target.value)} className="input-base" placeholder="Palermo" />
              </div>
            </div>
          </fieldset>

          {/* Características */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-surface-800 mb-2">Características</legend>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Habitaciones</label>
                <input type="number" min="0" value={form.bedrooms} onChange={(e) => updateField('bedrooms', e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Baños</label>
                <input type="number" min="0" value={form.bathrooms} onChange={(e) => updateField('bathrooms', e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Max Huésp.</label>
                <input type="number" min="1" value={form.max_guests} onChange={(e) => updateField('max_guests', e.target.value)} className="input-base" />
              </div>
            </div>
          </fieldset>

          {/* Airbnb */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-surface-800 mb-2">Airbnb</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-700 mb-1.5">URL de Airbnb</label>
                <input value={form.airbnb_url} onChange={(e) => updateField('airbnb_url', e.target.value)} className="input-base" placeholder="https://airbnb.com/rooms/..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Precio/Noche ($)</label>
                <input type="number" step="0.01" min="0" value={form.airbnb_price_per_night} onChange={(e) => updateField('airbnb_price_per_night', e.target.value)} className="input-base" placeholder="50.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Tiempo Limpieza (min)</label>
                <input type="number" min="0" value={form.avg_cleaning_time_min} onChange={(e) => updateField('avg_cleaning_time_min', e.target.value)} className="input-base" placeholder="90" />
              </div>
            </div>
          </fieldset>

          {/* Propietario */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-surface-800 mb-2">Propietario</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Nombre *</label>
                <input value={form.owner_name} onChange={(e) => updateField('owner_name', e.target.value)} className="input-base" placeholder="Carlos García" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">% Ganancias</label>
                <input type="number" step="0.01" min="0" max="100" value={form.owner_percentage} onChange={(e) => updateField('owner_percentage', e.target.value)} className="input-base" placeholder="50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Teléfono</label>
                <input value={form.owner_phone} onChange={(e) => updateField('owner_phone', e.target.value)} className="input-base" placeholder="+54 9 11..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1.5">Email</label>
                <input type="email" value={form.owner_email} onChange={(e) => updateField('owner_email', e.target.value)} className="input-base" placeholder="dueño@email.com" />
              </div>
            </div>
          </fieldset>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} className="input-base min-h-[80px] resize-y" placeholder="Notas adicionales..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {depto ? 'Guardar Cambios' : 'Crear Departamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
