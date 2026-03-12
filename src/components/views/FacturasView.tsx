'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Invoice } from '@/lib/types'
import {
  Plus, Search, FileText, Loader2, X, Edit3, Trash2, CheckCircle2, Calendar,
} from 'lucide-react'

const TYPES: Record<string, string> = { agua: 'Agua', luz: 'Luz', gas: 'Gas', internet: 'Internet', impuesto: 'Impuesto', otro: 'Otro' }
const TYPE_COLORS: Record<string, string> = {
  agua: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  luz: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  gas: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  internet: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  impuesto: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
  otro: 'badge-cancelled',
}

export default function FacturasPage() {
  const { profile } = useProfile()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paidFilter, setPaidFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [deptos, setDeptos] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [invRes, deptRes] = await Promise.all([
      supabase.from('invoices').select('*, deptos(name)').order('due_date', { ascending: false }),
      supabase.from('deptos').select('id, name').eq('is_active', true).order('name'),
    ])
    setInvoices(invRes.data || [])
    setDeptos(deptRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.description.toLowerCase().includes(search.toLowerCase()) ||
      (inv as any).deptos?.name?.toLowerCase().includes(search.toLowerCase())
    const matchPaid = paidFilter === 'all' || (paidFilter === 'paid' ? inv.is_paid : !inv.is_paid)
    return matchSearch && matchPaid
  })

  const totalPending = invoices.filter((i) => !i.is_paid).reduce((s, i) => s + i.amount, 0)

  const handleMarkPaid = async (id: string) => {
    await supabase.from('invoices').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta factura?')) return
    await supabase.from('invoices').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas</h1>
          <p className="text-surface-600 text-sm mt-1">
            Pendientes: <span className="text-accent-rose font-medium">${totalPending.toLocaleString()}</span>
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nueva Factura
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base pl-11" placeholder="Buscar factura..." />
        </div>
        <div className="flex gap-2">
          {['all', 'unpaid', 'paid'].map((f) => (
            <button key={f} onClick={() => setPaidFilter(f)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              paidFilter === f ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20' : 'text-surface-600 hover:text-white hover:bg-surface-300 border border-transparent'
            }`}>
              {f === 'all' ? 'Todas' : f === 'unpaid' ? 'Pendientes' : 'Pagadas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><FileText size={48} className="text-surface-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-white mb-2">Sin facturas</h3></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => (
            <div key={inv.id} className="bg-surface-100 border border-surface-400/50 rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-300 flex items-center justify-center">
                    <FileText size={20} className="text-surface-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{inv.description || TYPES[inv.type]}</h3>
                    <p className="text-sm text-surface-600">
                      {(inv as any).deptos?.name} · Vence: {inv.due_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">${inv.amount.toLocaleString()}</span>
                  <span className={`badge ${TYPE_COLORS[inv.type]}`}>{TYPES[inv.type]}</span>
                  {inv.is_paid ? (
                    <span className="badge badge-completed">Pagada</span>
                  ) : (
                    <>
                      <span className="badge badge-urgent">Pendiente</span>
                      <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Marcar pagada">
                        <CheckCircle2 size={15} />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setEditing(inv); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-white transition-colors">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <InvoiceFormModal
          invoice={editing}
          deptos={deptos}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchData() }}
        />
      )}
    </div>
  )
}

function InvoiceFormModal({ invoice, deptos, onClose, onSaved }: {
  invoice: Invoice | null
  deptos: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    depto_id: invoice?.depto_id || '',
    type: invoice?.type || 'otro',
    description: invoice?.description || '',
    amount: invoice?.amount?.toString() || '',
    due_date: invoice?.due_date || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      depto_id: form.depto_id,
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
    }
    if (invoice) {
      await supabase.from('invoices').update(payload).eq('id', invoice.id)
    } else {
      await supabase.from('invoices').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const u = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-100 border border-surface-400/50 rounded-2xl w-full max-w-md animate-scale-in">
        <div className="border-b border-surface-400/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{invoice ? 'Editar Factura' : 'Nueva Factura'}</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Tipo *</label>
              <select value={form.type} onChange={(e) => u('type', e.target.value)} className="input-base">
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">Monto ($) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => u('amount', e.target.value)} className="input-base" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Descripción</label>
            <input value={form.description} onChange={(e) => u('description', e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">Fecha Vencimiento *</label>
            <input type="date" value={form.due_date} onChange={(e) => u('due_date', e.target.value)} className="input-base" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {invoice ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
