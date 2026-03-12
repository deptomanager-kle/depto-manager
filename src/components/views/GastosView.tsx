'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Expense } from '@/lib/types'
import {
  Plus, Search, Receipt, Loader2, X, Edit3, Trash2, CheckCircle2, DollarSign
} from 'lucide-react'

const CATEGORIES: Record<string, string> = {
  servicios: 'Servicios',
  reparacion: 'Reparación',
  limpieza: 'Limpieza',
  suministros: 'Suministros',
  impuestos: 'Impuestos',
  otro: 'Otro',
}

const CATEGORY_COLORS: Record<string, string> = {
  servicios: 'badge-active',
  reparacion: 'badge-urgent',
  limpieza: 'badge-completed',
  suministros: 'badge-pending',
  impuestos: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  otro: 'badge-cancelled',
}

export default function GastosPage() {
  const { profile } = useProfile()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deptos, setDeptos] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [expRes, deptRes] = await Promise.all([
      supabase.from('expenses').select('*, deptos(name), profiles:uploaded_by(full_name)').order('expense_date', { ascending: false }),
      supabase.from('deptos').select('id, name').eq('is_active', true).order('name'),
    ])
    setExpenses(expRes.data || [])
    setDeptos(deptRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e as any).deptos?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0)
  const pendingReimbursement = filtered.filter((e) => !e.is_reimbursed).reduce((sum, e) => sum + e.amount, 0)

  const handleReimburse = async (id: string) => {
    await supabase.from('expenses').update({ is_reimbursed: true, reimbursed_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gastos</h1>
          <p className="text-surface-600 text-sm mt-1">
            Total: <span className="text-accent-amber font-medium">${totalExpenses.toLocaleString()}</span>
            {pendingReimbursement > 0 && (
              <> · Por reembolsar: <span className="text-accent-rose font-medium">${pendingReimbursement.toLocaleString()}</span></>
            )}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-11" placeholder="Buscar gasto..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Receipt size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin gastos</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp, i) => (
            <div key={exp.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <DollarSign size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{exp.description}</h3>
                    <p className="text-sm text-surface-600">{(exp as any).deptos?.name} · {exp.expense_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">${exp.amount.toLocaleString()}</span>
                  <span className={`badge ${CATEGORY_COLORS[exp.category]}`}>{CATEGORIES[exp.category]}</span>
                  {exp.is_reimbursed ? (
                    <span className="badge badge-completed">Reembolsado</span>
                  ) : (
                    profile?.role === 'admin' && (
                      <button onClick={() => handleReimburse(exp.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Marcar reembolsado">
                        <CheckCircle2 size={15} />
                      </button>
                    )
                  )}
                  <button onClick={() => { setEditing(exp); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-white transition-colors">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExpenseFormModal
          expense={editing}
          deptos={deptos}
          profileId={profile?.id || ''}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchData() }}
        />
      )}
    </div>
  )
}

function ExpenseFormModal({ expense, deptos, profileId, onClose, onSaved }: {
  expense: Expense | null
  deptos: { id: string; name: string }[]
  profileId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    depto_id: expense?.depto_id || '',
    category: expense?.category || 'otro',
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      depto_id: form.depto_id,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      uploaded_by: profileId,
    }
    if (expense) {
      await supabase.from('expenses').update(payload).eq('id', expense.id)
    } else {
      await supabase.from('expenses').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const u = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-100 border border-surface-400/50 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-surface-100 border-b border-surface-400/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-white">{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
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
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Categoría *</label>
            <select value={form.category} onChange={(e) => u('category', e.target.value)} className="input-base">
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Descripción *</label>
            <input value={form.description} onChange={(e) => u('description', e.target.value)} className="input-base" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Monto ($) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => u('amount', e.target.value)} className="input-base" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Fecha *</label>
              <input type="date" value={form.expense_date} onChange={(e) => u('expense_date', e.target.value)} className="input-base" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {expense ? 'Guardar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
