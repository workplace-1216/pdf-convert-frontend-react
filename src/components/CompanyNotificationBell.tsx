import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, X } from 'lucide-react'
import { API_URL } from '../config/api.config'

interface Notification {
  id: number
  clientEmail: string
  documentCount: number
  sentAt: string
  isRead: boolean
  createdAt: string
}

export const CompanyNotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<number[]>([])
  const bellRef = useRef<HTMLButtonElement>(null)

  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('companyDismissedNotifications')
    if (dismissed) {
      try {
        setDismissedIds(JSON.parse(dismissed))
      } catch (e) {
        console.error('Error parsing dismissed notifications:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Poll for new notifications every 10 seconds
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/company-notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // Filter out dismissed notifications
          const visibleNotifications = data.filter((n: Notification) => !dismissedIds.includes(n.id))
          setNotifications(visibleNotifications)
          setUnreadCount(visibleNotifications.filter((n: Notification) => !n.isRead).length)
        }
      } catch (error) {
        console.error('[CompanyNotificationBell] Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [dismissedIds])

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/company-notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('[CompanyNotificationBell] Error marking notification as read:', error)
    }
  }

  const handleDismissNotification = (id: number) => {
    // Dismiss single notification from modal (not from DB)
    const newDismissedIds = [...dismissedIds, id]
    setDismissedIds(newDismissedIds)
    localStorage.setItem('companyDismissedNotifications', JSON.stringify(newDismissedIds))
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleClearAll = () => {
    // Only hide notifications in modal, don't delete from database
    const currentNotificationIds = notifications.map(n => n.id)
    const newDismissedIds = [...dismissedIds, ...currentNotificationIds]
    setDismissedIds(newDismissedIds)
    localStorage.setItem('companyDismissedNotifications', JSON.stringify(newDismissedIds))
    setNotifications([])
    setUnreadCount(0)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        ref={bellRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-[#eb3089]/20 rounded-lg transition-all duration-300"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black/30 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

          {/* Notification Modal Panel - Positioned relative to bell icon */}
          <div 
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-[#eb3089]/40 z-50 max-h-[70vh] overflow-hidden flex flex-col"
            style={{
              top: '100%'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black">{t('company.notifications')}</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-[#eb3089] hover:underline"
                  >
                    {t('company.clearAll')}
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">{t('company.noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors relative group ${
                        !notification.isRead ? 'bg-[#eb3089]/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg cursor-pointer ${
                            !notification.isRead ? 'bg-[#eb3089]' : 'bg-gray-300'
                          }`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Bell className={`h-4 w-4 ${
                            !notification.isRead ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black">
                            {t('company.newDocumentsReceived')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.documentCount} {t('company.documentsFrom')} {notification.clientEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.sentAt).toLocaleString('es-MX')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDismissNotification(notification.id)
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with View All */}
            <div className="p-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => { setShowDropdown(false); navigate('/company/notifications') }}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#eb3089] hover:bg-[#eb3089]/80 rounded-lg transition-all duration-300"
              >
                {t('company.viewAllNotifications')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

