import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, ArrowLeft, Trash2, CheckCircle, FileText, XCircle, AlertCircle } from 'lucide-react'
import { API_URL } from '../config/api.config'
import { Skeleton } from '../components/Skeleton'

interface Notification {
  id: number
  clientEmail: string
  documentCount: number
  sentAt: string
  isRead: boolean
  createdAt: string
}

export const CompanyNotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/company-notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/company-notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))

        // Also add to dismissed list so it disappears from bell modal
        const dismissed = localStorage.getItem('companyDismissedNotifications')
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
          localStorage.setItem('companyDismissedNotifications', JSON.stringify(dismissedIds))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleConfirmClearAll = async () => {
    setClearing(true)
    try {
      const response = await fetch(`${API_URL}/company-notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // Add all current notification IDs to dismissed list
        const notificationIds = notifications.map(n => n.id)
        const dismissed = localStorage.getItem('companyDismissedNotifications')
        let dismissedIds: number[] = []
        if (dismissed) {
          try {
            dismissedIds = JSON.parse(dismissed)
          } catch (e) {
            console.error('Error parsing dismissed notifications:', e)
          }
        }
        const newDismissedIds = [...new Set([...dismissedIds, ...notificationIds])]
        localStorage.setItem('companyDismissedNotifications', JSON.stringify(newDismissedIds))

        setNotifications([])
        setShowClearAllModal(false)
      } else {
        console.error('Error clearing notifications')
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/company')}
            className="flex items-center space-x-2 text-black hover:text-[#eb3089] transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">{t('company.backToDashboard')}</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">{t('company.notifications')}</h1>
              <p className="text-sm text-black/60">
                {notifications.filter(n => !n.isRead).length} {t('company.unreadOf')} {notifications.length} {t('company.total')}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-300 hover:scale-105"
              >
                {t('company.clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-md border border-[#eb3089]/30 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="space-y-4">
                <Skeleton variant="text" width="60%" height={24} className="mx-auto" />
                <Skeleton variant="text" width="40%" height={16} className="mx-auto" />
                <Skeleton count={3} />
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">{t('company.noNotifications')}</h3>
              <p className="text-sm text-black/60">{t('company.whenReceiveDocuments')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-[#eb3089]/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-xl ${
                        !notification.isRead ? 'bg-[#eb3089]' : 'bg-gray-300'
                      }`}>
                        <FileText className={`h-5 w-5 ${
                          !notification.isRead ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-semibold text-black">
                            {t('company.newDocumentsReceived')}
                          </h3>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-[#eb3089] text-white rounded-full">
                              {t('company.newBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 mb-2">
                          {notification.documentCount} {t('company.documentsSentBy')}{' '}
                          <span className="font-medium text-black">{notification.clientEmail}</span>
                        </p>
                        <p className="text-xs text-black/50">
                          {new Date(notification.sentAt).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title={t('company.markAsRead')}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('company.deleteNotification')}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !clearing) {
              setShowClearAllModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowClearAllModal(false)}
              disabled={clearing}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">{t('company.confirmDeletion')}</h3>
              </div>

              <p className="text-sm text-black/70 mb-4">
                {t('company.confirmDeleteAll')}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-black font-medium mb-1">
                  {t('company.willBeDeleted')} {notifications.length} {t('company.notificationCount')}
                </p>
                <p className="text-xs text-red-600 font-medium mt-2">{t('company.cannotUndo')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowClearAllModal(false)}
                disabled={clearing}
                className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
              >
                {t('company.cancel')}
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={clearing}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? t('company.deleting') : t('company.yesDeleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

