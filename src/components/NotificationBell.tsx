import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { documentApi } from '../services/api'

interface Notification {
  id: number
  documentCount: number
  sentAt: string
  clientEmail: string
  read: boolean
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Poll for new notifications every 10 seconds
    const fetchNotifications = async () => {
      try {
        const data = await documentApi.getNotifications()
        console.log('[NotificationBell] Received notifications:', data)
        // Map backend properties (PascalCase) to frontend (camelCase)
        const mappedData = data.map((n: any) => ({
          id: n.Id || n.id,
          documentCount: n.DocumentCount || n.documentCount,
          sentAt: n.SentAt || n.sentAt,
          clientEmail: n.ClientEmail || n.clientEmail,
          read: n.Read || n.read || false
        }))
        setNotifications(mappedData)
        setUnreadCount(mappedData.filter(n => !n.read).length)
      } catch (error) {
        console.error('[NotificationBell] Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: number) => {
    try {
      await documentApi.markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[NotificationBell] Error marking notification as read:', error)
    }
  }

  const handleClearAll = async () => {
    try {
      await documentApi.clearAllNotifications()
      setNotifications([])
      setUnreadCount(0)
      setShowDropdown(false)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/30 rounded-lg transition-all duration-300 mr-[70px]"
      >
        <Bell className="h-5 w-5 text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#eb3089] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowDropdown(false)} />

          {/* Centered Modal Panel */}
          <div className="fixed right-6 top-16 w-96 bg-white rounded-xl shadow-2xl border border-[#64c7cd]/40 z-50 max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black">Notificaciones</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-[#eb3089] hover:underline"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-[#64c7cd]/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          !notification.read ? 'bg-[#eb3089]' : 'bg-gray-300'
                        }`}>
                          <Bell className={`h-4 w-4 ${
                            !notification.read ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black">
                            Nuevos documentos recibidos
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.documentCount} documento(s) de {notification.clientEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.sentAt).toLocaleString('es-MX')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-[#eb3089] rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with View All */}
            <div className="p-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => { setShowDropdown(false); navigate('/admin/notifications') }}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#64c7cd] hover:bg-[#54b5bb] rounded-lg"
              >
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

