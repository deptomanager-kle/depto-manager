'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfile } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { Notification as AppNotification } from '@/lib/types'
import { Bell, CheckCircle, Loader2, Trash2, Check } from 'lucide-react'

const TYPE_ICONS: Record<string, string> = {
  cleaning_assigned: '🧹',
  booking_created: '📅',
  booking_updated: '✏️',
  payment_received: '💰',
  expense_reimbursed: '✅',
  general: '📢',
}

export default function NotificacionesPage() {
  const { profile } = useProfile()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    if (!profile) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const formatTime = (dt: string) => {
    const d = new Date(dt)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days}d`
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-surface-600 text-sm mt-1">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <Check size={16} /> Marcar todas leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-400" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin notificaciones</h3>
          <p className="text-surface-600 text-sm">Aquí verás tus avisos y actualizaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={`relative bg-surface-100 border rounded-2xl p-4 transition-all animate-slide-up ${
                n.is_read ? 'border-surface-400/50' : 'border-brand-600/30 bg-brand-600/5'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {!n.is_read && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              )}
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{TYPE_ICONS[n.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{n.title}</h3>
                  {n.body && <p className="text-xs text-surface-600 mt-1 line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-surface-500 mt-2">{formatTime(n.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-surface-300 text-surface-600 hover:text-brand-400 transition-colors" title="Marcar leída">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors" title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
