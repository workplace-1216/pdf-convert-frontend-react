import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Trash2, UserPlus, Building, FileText } from 'lucide-react'
import { API_URL } from '../config/api.config'

interface AdminNotification {
  id: number
  type: string
  message: string
  userEmail?: string | null
  companyName?: string | null
  companyRfc?: string | null
  isRead: boolean
  createdAt: string
}

export const AdminNotificationsPage: React.FC = () => {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/admin-notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setError(null)
      } else {
        setError(t('admin.errorLoadingNotifications'))
      }
    } catch (e: any) {
      setError(e?.message || t('admin.errorLoadingNotifications'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/admin-notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteOne = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/admin-notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))

        // Also add to dismissed list so it disappears from bell modal
        const dismissed = localStorage.getItem('dismissedNotifications')
        let dismissedIds: number[] = []
        if (dismissed) {
          try {
            dismissedIds = JSON.parse(dismissed)
          } catch (e) {
            console.error('Error parsing dismissed notifications:', e)
          }
        }
        if (!dismissedIds.includes(id)) {
          dismissedIds.push(id)
          localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedIds))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    try {
      setClearing(true)
      const response = await fetch(`${API_URL}/admin-notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // Add all current notification IDs to dismissed list
        const notificationIds = notifications.map(n => n.id)
        const dismissed = localStorage.getItem('dismissedNotifications')
        let dismissedIds: number[] = []
        if (dismissed) {
          try {
            dismissedIds = JSON.parse(dismissed)
          } catch (e) {
            console.error('Error parsing dismissed notifications:', e)
          }
        }
        const newDismissedIds = [...new Set([...dismissedIds, ...notificationIds])]
        localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds))

        setNotifications([])
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setClearing(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_USER':
        return <UserPlus className="h-5 w-5" />
      case 'NEW_COMPANY':
        return <Building className="h-5 w-5" />
      case 'DOCUMENT_SENT':
        return <FileText className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getTitle = (notification: AdminNotification) => {
    switch (notification.type) {
      case 'NEW_USER':
        return t('admin.newClientRegistered')
      case 'NEW_COMPANY':
        return t('admin.newCompanyRegistered')
      case 'DOCUMENT_SENT':
        return t('admin.documentsReceived')
      default:
        return t('admin.notification')
    }
  }

  const getDescription = (notification: AdminNotification) => {
    switch (notification.type) {
      case 'NEW_USER':
        return notification.userEmail || notification.message
      case 'NEW_COMPANY':
        return `${notification.companyName || ''} (${notification.companyRfc || ''})`
      default:
        return notification.message
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-black">{t('admin.notifications')}</h1>
        <button
          onClick={clearAll}
          disabled={clearing || notifications.length === 0}
          className={`mr-[60px] px-3 py-2 text-xs font-semibold rounded-lg ${notifications.length === 0 ? 'bg-gray-300 text-white' : 'bg-[#eb3089] text-white hover:bg-[#d3287a]'}`}
        >
          {t('admin.clearAll')}
        </button>
      </div>

      {loading ? (
        <p className="text-black/60">{t('admin.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : notifications.length === 0 ? (
        <div className="flex items-center justify-center h-64 flex-col text-gray-500">
          <Bell className="w-10 h-10 mb-2" />
          {t('admin.noNotifications')}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-[#64c7cd]/40 divide-y">
          {notifications.map(n => (
            <div key={n.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${n.isRead ? 'bg-gray-300' : 'bg-[#64c7cd]'}`}>
                  <div className={n.isRead ? 'text-gray-700' : 'text-white'}>
                    {getIcon(n.type)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-black font-semibold">{getTitle(n)}</div>
                  <div className="text-xs text-gray-600 mt-1">{getDescription(n)}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('es-MX')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!n.isRead && (
                  <button onClick={() => markAsRead(n.id)} className="px-2 py-1 text-xs bg-[#64c7cd] text-white rounded-lg flex items-center space-x-1 hover:bg-[#54b5bb]">
                    <span>{t('admin.read')}</span>
                  </button>
                )}
                <button onClick={() => deleteOne(n.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg flex items-center space-x-1 hover:bg-red-600">
                  <Trash2 className="w-3 h-3" /><span>{t('admin.deleteNotification')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


