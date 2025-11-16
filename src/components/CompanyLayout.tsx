import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building,
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CompanyNotificationBell } from './CompanyNotificationBell'
import LanguageSwitcher from './LanguageSwitcher'

interface CompanyLayoutProps {
  children: React.ReactNode
}

export const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebarItems = [
    {
      id: 'dashboard',
      label: t('company.dashboard'),
      icon: LayoutDashboard,
      path: '/company'
    },
    {
      id: 'documents',
      label: t('company.documents'),
      icon: FileText,
      path: '/company/documents'
    },
    {
      id: 'users',
      label: t('company.userManagement'),
      icon: Users,
      path: '/company/users'
    },
    {
      id: 'notifications',
      label: t('company.notifications'),
      icon: Bell,
      path: '/company/notifications'
    }
  ]

  const isActivePath = (path: string) => {
    if (path === '/company') {
      return location.pathname === '/company'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#eb3089] rounded-xl">
              <Building className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-black text-lg">{t('company.companyDashboard')}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#eb3089] text-white shadow-lg'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-black'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#64c7cd]/20 rounded-full">
              <Building className="h-5 w-5 text-[#64c7cd]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">{user?.email}</p>
              <p className="text-xs text-black/60">{t('company.companyAccount')}</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Top Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-72 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6 text-black" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <CompanyNotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
