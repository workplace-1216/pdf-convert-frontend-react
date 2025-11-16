import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  LogOut,
  Home,
  UserCheck,
  PieChart,
  MoreHorizontal
} from 'lucide-react'
import { AdminNotificationBell } from './AdminNotificationBell'
import LanguageSwitcher from './LanguageSwitcher'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { t } = useTranslation()

  const sidebarItems = [
    { id: 'dashboard', label: t('admin.dashboard'), icon: Home, path: '/admin' },
    { id: 'users', label: t('admin.userManagement'), icon: UserCheck, path: '/admin/users' },
    // { id: 'documents', label: t('admin.documentManagement'), icon: FileCheck, path: '/admin/documents' },
    { id: 'reports', label: t('admin.reportsAndAnalytics'), icon: PieChart, path: '/admin/reports' }
  ]

  return (
    <div className="h-screen bg-gray-50 relative overflow-hidden">
      {/* Advanced Animated Background (disabled for white theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden">
        {/* Floating Orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse delay-1000"></div>
      </div>

      {/* Sidebar */}
      {/* Mobile/Tablet overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile/Tablet off-canvas sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 bg-white border-r border-[#64c7cd]/30 flex flex-col z-40 lg:hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#64c7cd]/30">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="relative p-2 rounded-xl">
                <img src="/logo.png" alt="CAAST" className="h-12 sm:h-12" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">{t('admin.adminPanel')}</h1>
              <p className="text-xs text-black">{t('admin.managementSystem')}</p>
            </div>
          </div>
        </div>
        {/* Sidebar Navigation */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-[#64c7cd]/15 border border-[#64c7cd]/40'
                    : 'hover:bg-[#64c7cd]/10 hover:border-[#64c7cd]/30 border border-transparent'
                  }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#64c7cd]' : 'bg-[#64c7cd]/10 group-hover:bg-[#64c7cd]/20'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
                </div>
                <span className="text-sm font-medium text-black">{item.label}</span>
              </Link>
            )
          })}
        </div>
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#64c7cd]/30">
          <button
            onClick={logout}
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#eb3089]/10 hover:border-[#eb3089]/30 border border-transparent transition-all duration-300 group w-full"
          >
            <div className="p-2 rounded-lg bg-[#eb3089]/10 group-hover:bg-[#eb3089]/20">
              <LogOut className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-medium text-black">{t('admin.logout')}</span>
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-[91px]'} transition-all duration-300 bg-white border-r border-[#64c7cd]/30 flex flex-col relative z-10 hidden lg:flex`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#64c7cd]/30">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="relative p-2 rounded-xl">
                <img src="/logo.png" alt="CAAST" className="h-12 sm:h-12" />
              </div>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-black">
                  {t('admin.adminPanel')}
                </h1>
                <p className="text-xs text-black">{t('admin.managementSystem')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-[#64c7cd]/15 border border-[#64c7cd]/40'
                    : 'hover:bg-[#64c7cd]/10 hover:border-[#64c7cd]/30 border border-transparent'
                  }`}
              >
                <div className={`p-2 rounded-lg ${isActive
                    ? 'bg-[#64c7cd]'
                    : 'bg-[#64c7cd]/10 group-hover:bg-[#64c7cd]/20'
                  }`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
                </div>
                {sidebarOpen && (
                  <span className={`text-sm font-medium ${isActive ? 'text-black' : 'text-black'
                    }`}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#64c7cd]/30">
          <button
            onClick={logout}
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#eb3089]/10 hover:border-[#eb3089]/30 border border-transparent transition-all duration-300 group w-full"
          >
            <div className="p-2 rounded-lg bg-[#eb3089]/10 group-hover:bg-[#eb3089]/20">
              <LogOut className="h-4 w-4 text-black" />
            </div>
            {sidebarOpen && (
              <span className="text-sm font-medium text-black">
                {t('admin.logout')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className={`fixed top-0 right-0 bg-[#64c7cd] border-b border-[#64c7cd]/30 p-4 z-20 transition-all duration-300 ${
          sidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-[91px]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 hover:bg-white/30 rounded-lg transition-all duration-300"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <MoreHorizontal className="h-5 w-5 text-black" />
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-white/30 rounded-lg transition-all duration-300"
              >
                <MoreHorizontal className="h-5 w-5 text-black" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-black">{t('admin.adminPanelTitle')}</h2>
                <p className="text-sm text-black">{t('admin.integralManagementSystem')}</p>
              </div>
            </div>
            {/* Language Switcher and Notification Bell */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <AdminNotificationBell />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto pt-20 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[91px]'
        }`}>
          {children}
        </div>
      </div>
    </div>
  )
}
