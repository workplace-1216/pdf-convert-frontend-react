import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Eye,
  Trash2,
  XCircle,
  AlertCircle,
  CheckCircle,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { API_URL } from '../config/api.config'

interface CompanyUser {
  id: number
  name: string
  email: string
  role: 'client' | 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive'
  rfc?: string
  whatsapp?: string
  createdAt: string
}

export const CompanyUserManagementPage: React.FC = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingUser, setViewingUser] = useState<CompanyUser | null>(null)
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'client' | 'admin' | 'user' | 'viewer',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/companies/users?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user?: CompanyUser) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'user',
        status: 'active'
      })
    }
    setShowModal(true)
    setErrorMessage('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setErrorMessage('')
  }

  const handleViewUser = (user: CompanyUser) => {
    setViewingUser(user)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    try {
      const url = editingUser
        ? `${API_URL}/companies/users/${editingUser.id}`
        : `${API_URL}/companies/users`

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccessMessage(
          editingUser
            ? t('company.userUpdatedSuccess')
            : t('company.userCreatedSuccess')
        )
        handleCloseModal()
        setCurrentPage(1)
        fetchUsers()
      } else {
        const data = await response.json()
        setErrorMessage(data.message || t('common.error'))
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (user: CompanyUser) => {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    setDeleting(true)
    try {
      const response = await fetch(`${API_URL}/companies/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccessMessage(t('company.userDeletedSuccess'))
        setShowDeleteModal(false)
        setDeletingUser(null)
        setCurrentPage(1)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return t('admin.client')
      case 'admin':
        return t('company.admin')
      case 'user':
        return t('company.companyUser')
      case 'viewer':
        return t('company.viewer')
      default:
        return role
    }
  }

  const getStatusLabel = (status: string) => {
    return status === 'active' ? t('company.active') : t('company.inactive')
  }

  return (
    <div className="p-6 px-20">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#eb3089] rounded-xl">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">{t('company.userManagement')}</h1>
            <p className="text-sm text-black/60">{t('company.users')}: {totalCount}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#64c7cd] mx-auto mb-4"></div>
            <p className="text-black/60">{t('admin.loading')}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">{t('company.noUsers')}</h3>
            <p className="text-sm text-black/60">{t('company.contactAdmin')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#64c7cd]/15 border-b border-[#64c7cd]/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.userName')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.userEmail')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.userRole')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.userStatus')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#64c7cd]/20 rounded-lg">
                          <User className="h-4 w-4 text-[#64c7cd]" />
                        </div>
                        <span className="text-sm font-medium text-black">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-black">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title={t('admin.viewDetails')}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title={t('company.deleteUser')}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="border-t border-[#64c7cd]/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/60">
                {t('company.showingPage')} {currentPage} {t('company.of')} {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t('company.previous')}</span>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>{t('company.next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              handleCloseModal()
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseModal}
              disabled={saving}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <h3 className="text-xl font-bold text-black mb-6">
              {editingUser ? t('company.updateUser') : t('company.createUser')}
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {t('company.fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {t('company.emailAddress')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {t('company.userRole')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent"
                >
                  <option value="user">{t('company.companyUser')}</option>
                  <option value="admin">{t('company.admin')}</option>
                  <option value="viewer">{t('company.viewer')}</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {t('company.userStatus')} *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent"
                >
                  <option value="active">{t('company.active')}</option>
                  <option value="inactive">{t('company.inactive')}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
                >
                  {t('company.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#eb3089] rounded-xl hover:bg-[#eb3089]/90 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('company.saving') : t('company.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseViewModal()
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseViewModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-[#64c7cd] rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">{t('admin.userDetails')}</h3>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1">
                  {t('company.fullName')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black">
                  {viewingUser.name}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1">
                  {t('company.emailAddress')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black">
                  {viewingUser.email}
                </div>
              </div>

              {/* RFC */}
              {viewingUser.rfc && (
                <div>
                  <label className="block text-sm font-medium text-black/60 mb-1">
                    RFC
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-mono">
                    {viewingUser.rfc}
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {viewingUser.whatsapp && (
                <div>
                  <label className="block text-sm font-medium text-black/60 mb-1">
                    WhatsApp
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black">
                    {viewingUser.whatsapp}
                  </div>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1">
                  {t('company.userRole')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {getRoleLabel(viewingUser.role)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1">
                  {t('company.userStatus')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      viewingUser.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusLabel(viewingUser.status)}
                  </span>
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm font-medium text-black/60 mb-1">
                  {t('admin.createdAt')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black">
                  {new Date(viewingUser.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                onClick={handleCloseViewModal}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-[#64c7cd] rounded-xl hover:bg-[#64c7cd]/90 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {t('company.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false)
              setDeletingUser(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setDeletingUser(null)
              }}
              disabled={deleting}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">{t('company.deleteUser')}</h3>
              </div>

              <p className="text-sm text-black/70 mb-4">
                {t('company.confirmDeleteUser')}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-black mb-1">{deletingUser.name}</p>
                <p className="text-sm text-black/60 mb-2">{deletingUser.email}</p>
                <p className="text-xs text-red-600 font-medium">{t('company.userWillBeDeleted')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingUser(null)
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
              >
                {t('company.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? t('company.deleting') : t('company.yesDeleteUser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
