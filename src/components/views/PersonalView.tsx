'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Profile } from '@/lib/types'
import {
  Search, Users, Loader2, MapPin, DollarSign, Phone, Mail,
} from 'lucide-react'

export default function PersonalPage() {
  const { profile } = useProfile()
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'limpieza')
      .order('full_name')
    setStaff(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = staff.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Personal de Limpieza</h1>
        <p className="text-surface-600 text-sm mt-1">{staff.length} persona{staff.length !== 1 ? 's' : ''} registrada{staff.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-11" placeholder="Buscar por nombre o ubicación..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin personal</h3>
          <p className="text-surface-600 text-sm">El personal de limpieza se registra por su cuenta</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((person, i) => (
            <div key={person.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  {person.full_name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white truncate">{person.full_name}</h3>
                    <span className={`badge ${person.is_active ? 'badge-active' : 'badge-cancelled'}`}>
                      {person.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    {person.location && (
                      <p className="flex items-center gap-1.5 text-surface-700">
                        <MapPin size={13} className="text-surface-600" />{person.location}
                      </p>
                    )}
                    {person.hourly_rate && (
                      <p className="flex items-center gap-1.5 text-accent-teal">
                        <DollarSign size={13} />${person.hourly_rate}/hora
                      </p>
                    )}
                    {person.phone && (
                      <p className="flex items-center gap-1.5 text-surface-700">
                        <Phone size={13} className="text-surface-600" />{person.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-surface-600 text-xs">
                      <Mail size={12} />{person.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
