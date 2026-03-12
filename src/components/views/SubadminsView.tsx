'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Profile, Depto } from '@/lib/types'
import {
  Search, UserCog, Loader2, Home, Plus, X, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'

export default function SubadminsPage() {
  const { profile } = useProfile()
  const [subadmins, setSubadmins] = useState<(Profile & { assignments?: { depto_id: string; deptos: { name: string } }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState<string | null>(null)
  const [allDeptos, setAllDeptos] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [saRes, depRes] = await Promise.all([
      supabase.from('profiles').select('*, depto_assignments(depto_id, deptos(name))').eq('role', 'subadmin').order('full_name'),
      supabase.from('deptos').select('id, name').eq('is_active', true).order('name'),
    ])
    setSubadmins((saRes.data || []) as any)
    setAllDeptos(depRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = subadmins.filter((sa) =>
    sa.full_name.toLowerCase().includes(search.toLowerCase()) ||
    sa.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssignDepto = async (subadminId: string, deptoId: string) => {
    await supabase.from('depto_assignments').insert({ subadmin_id: subadminId, depto_id: deptoId })
    fetchData()
  }

  const handleUnassignDepto = async (subadminId: string, deptoId: string) => {
    await supabase.from('depto_assignments').delete().eq('subadmin_id', subadminId).eq('depto_id', deptoId)
    fetchData()
  }

  const handleToggleActive = async (sa: Profile) => {
    await supabase.from('profiles').update({ is_active: !sa.is_active }).eq('id', sa.id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Sub-Administradores</h1>
        <p className="text-surface-600 text-sm mt-1">{subadmins.length} sub-admin{subadmins.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-11" placeholder="Buscar por nombre o email..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <UserCog size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin sub-administradores</h3>
          <p className="text-surface-600 text-sm">Los SA se registran por su cuenta y aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sa, i) => {
            const assignments = (sa as any).depto_assignments || []
            const isExpanded = expanded === sa.id

            return (
              <div key={sa.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl overflow-hidden card-hover animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                        {sa.full_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{sa.full_name}</h3>
                        <p className="text-sm text-surface-600">{sa.email} {sa.phone && `· ${sa.phone}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${sa.is_active ? 'badge-active' : 'badge-cancelled'}`}>
                        {sa.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="badge bg-surface-300/50 text-surface-800 ring-1 ring-surface-400">
                        {assignments.length} depto{assignments.length !== 1 ? 's' : ''}
                      </span>
                      <button onClick={() => handleToggleActive(sa)} className="btn-ghost text-xs">
                        {sa.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : sa.id)} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-400/30 p-5 bg-surface-200/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-surface-800">Departamentos Asignados</h4>
                      <button
                        onClick={() => setShowAssign(showAssign === sa.id ? null : sa.id)}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                      >
                        <Plus size={13} /> Asignar
                      </button>
                    </div>

                    {showAssign === sa.id && (
                      <div className="mb-3 p-3 bg-surface-200 rounded-xl">
                        <select
                          onChange={(e) => { if (e.target.value) { handleAssignDepto(sa.id, e.target.value); setShowAssign(null) } }}
                          className="input-base text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccionar departamento...</option>
                          {allDeptos
                            .filter((d) => !assignments.some((a: any) => a.depto_id === d.id))
                            .map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    )}

                    {assignments.length === 0 ? (
                      <p className="text-sm text-surface-600">Sin departamentos asignados</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments.map((a: any) => (
                          <div key={a.depto_id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-200/50">
                            <div className="flex items-center gap-2">
                              <Home size={14} className="text-surface-600" />
                              <span className="text-sm text-white">{a.deptos?.name}</span>
                            </div>
                            <button onClick={() => handleUnassignDepto(sa.id, a.depto_id)} className="p-1 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
