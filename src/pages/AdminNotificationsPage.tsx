import React, { useEffect, useState } from 'react'
import { Bell, Trash2, Check } from 'lucide-react'
import { documentApi } from '../services/api'

interface NotificationItem {
  id: number
  documentCount: number
  sentAt: string
  clientEmail: string
  read: boolean
}

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const data = await documentApi.getNotifications()
      const mapped = (data || []).map((n: any) => ({
        id: n.Id ?? n.id,
        documentCount: n.DocumentCount ?? n.documentCount,
        sentAt: n.SentAt ?? n.sentAt,
        clientEmail: n.ClientEmail ?? n.clientEmail,
        read: n.Read ?? n.read ?? false,
      }))
      setNotifications(mapped)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const markAsRead = async (id: number) => {
    await documentApi.markNotificationAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteOne = async (id: number) => {
    await documentApi.deleteNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = async () => {
    try {
      setClearing(true)
      await documentApi.clearAllNotifications()
      setNotifications([])
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-black">Notificaciones</h1>
        <button
          onClick={clearAll}
          disabled={clearing || notifications.length === 0}
          className={`mr-[60px] px-3 py-2 text-xs font-semibold rounded-lg ${notifications.length === 0 ? 'bg-gray-300 text-white' : 'bg-[#eb3089] text-white hover:bg-[#d3287a]'}`}
        >
          Limpiar todas
        </button>
      </div>

      {loading ? (
        <p className="text-black/60">Cargando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : notifications.length === 0 ? (
        <div className="flex items-center justify-center h-64 flex-col text-gray-500">
          <Bell className="w-10 h-10 mb-2" />
          No hay notificaciones
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-[#64c7cd]/40 divide-y">
          {notifications.map(n => (
            <div key={n.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${n.read ? 'bg-gray-300' : 'bg-[#eb3089]'}`}>
                  <Bell className={`${n.read ? 'text-gray-700' : 'text-white'}`} />
                </div>
                <div>
                  <div className="text-sm text-black font-semibold">{n.documentCount} documento(s) de {n.clientEmail}</div>
                  <div className="text-xs text-gray-500">{new Date(n.sentAt).toLocaleString('es-MX')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!n.read && (
                  <button onClick={() => markAsRead(n.id)} className="px-2 py-1 text-xs bg-[#64c7cd] text-white rounded-lg flex items-center space-x-1">
                    <Check className="w-3 h-3" /><span>Leído</span>
                  </button>
                )}
                <button onClick={() => deleteOne(n.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg flex items-center space-x-1">
                  <Trash2 className="w-3 h-3" /><span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


