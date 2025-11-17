import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Server
} from 'lucide-react'
import { adminApi } from '../services/api'
import type { AdminStats, ReportsAnalyticsResponse } from '../types/api'
import { DashboardSkeleton } from '../components/Skeleton'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Pie colors
const STATUS_COLORS = {
  processed: '#a5cc55',
  pending: '#64c7cd',
  error: '#eb3089'
}

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<ReportsAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          adminApi.getStats(),
          adminApi.getAnalytics('30d')
        ])
        setStats(s)
        setAnalytics(a)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const recentActivity = [
    { id: 1, type: 'user', message: t('admin.newClientRegistered'), time: '2 min', status: 'success' },
    { id: 2, type: 'document', message: t('admin.documentProcessedSuccess'), time: '5 min', status: 'success' },
    { id: 3, type: 'template', message: t('admin.templateUpdated'), time: '10 min', status: 'warning' },
    { id: 4, type: 'system', message: t('admin.systemOptimized'), time: '15 min', status: 'info' },
    { id: 5, type: 'document', message: t('admin.documentRequiresReview'), time: '20 min', status: 'error' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-[#a5cc55]'
      case 'warning': return 'bg-[#64c7cd]'
      case 'error': return 'bg-[#eb3089]'
      default: return 'bg-[#64c7cd]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 px-20">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 px-20 space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documents */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#64c7cd] rounded-xl shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">{t('admin.totalDocuments')}</p>
              <p className="text-2xl font-bold text-black">{stats?.totalDocuments?.toLocaleString() || '0'}</p>
              <p className="text-xs text-black mt-2">{t('admin.processed')}: {stats?.processedDocuments || 0}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#a5cc55] rounded-xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">{t('admin.activeUsers')}</p>
              <p className="text-2xl font-bold text-black">{stats?.activeUsers || 0}</p>
              <p className="text-xs text-black mt-2">{t('admin.total')}: {stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        {/* Processed Today */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#eb3089] rounded-xl shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">{t('admin.today')}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">{t('admin.processedToday')}</p>
              <p className="text-2xl font-bold text-black">{stats?.processedToday || 0}</p>
              <p className="text-xs text-black mt-2">{t('admin.pendingReview')}: {stats?.pendingDocuments || 0}</p>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#64c7cd] rounded-xl shadow-md">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{t('admin.excellent')}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">{t('admin.errorDocuments')}</p>
              <p className="text-2xl font-bold text-black">{stats?.errorDocuments || 0}</p>
              <p className="text-xs text-black mt-2">{t('admin.requireAttention')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Trends Chart */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">{t('admin.documentTrends')}</h3>
              <p className="text-sm text-black">{t('admin.last12Months')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#64c7cd] rounded-full"></div>
              <span className="text-xs text-black">{t('admin.documentsLabel')}</span>
              <div className="w-3 h-3 bg-[#a5cc55] rounded-full ml-2"></div>
              <span className="text-xs text-black">{t('admin.processed')}</span>
              <div className="w-3 h-3 bg-[#eb3089] rounded-full ml-2"></div>
              <span className="text-xs text-black">{t('admin.sent')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={(analytics?.monthlyTrends || []).map(m => ({ name: m.month, documents: m.documents, processed: m.processed, sent: m.sent || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.6)" />
              <YAxis stroke="rgba(0,0,0,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="documents" stroke="#64c7cd" strokeWidth={2} name={t('admin.documentsLabel')} />
              <Line type="monotone" dataKey="processed" stroke="#a5cc55" strokeWidth={2} name={t('admin.processed')} />
              <Line type="monotone" dataKey="sent" stroke="#eb3089" strokeWidth={2} name={t('admin.sent')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">{t('admin.userActivity')}</h3>
              <p className="text-sm text-black">{t('admin.last24Hours')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#a5cc55] rounded-full animate-pulse"></div>
              <span className="text-xs text-black">{t('admin.realTime')}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.userActivity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="time" stroke="rgba(0,0,0,0.6)" />
              <YAxis stroke="rgba(0,0,0,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000'
                }} 
              />
              <Area type="monotone" dataKey="users" stroke="#a5cc55" fill="rgba(165, 204, 85, 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Status Pie Chart */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">{t('admin.documentStatus')}</h3>
              <p className="text-sm text-black">{t('admin.currentDistribution')}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={[
                  { name: t('admin.processed'), value: stats?.processedDocuments || 0, color: STATUS_COLORS.processed },
                  { name: t('admin.pending'), value: stats?.pendingDocuments || 0, color: STATUS_COLORS.pending },
                  { name: t('admin.error'), value: stats?.errorDocuments || 0, color: STATUS_COLORS.error }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {[
                  STATUS_COLORS.processed,
                  STATUS_COLORS.pending,
                  STATUS_COLORS.error
                ].map((c, index) => (
                  <Cell key={`cell-${index}`} fill={c} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(216, 198, 198, 0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* System Metrics (derived from backend stats) */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">{t('admin.systemMetrics')}</h3>
              <p className="text-sm text-black">{t('admin.derivedFromStats')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#a5cc55] rounded-full animate-pulse"></div>
              <span className="text-xs text-black">{t('admin.stable')}</span>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const total = stats?.totalDocuments || 0
              const processedPct = total ? Math.round(((stats?.processedDocuments || 0) * 100) / total) : 0
              const pendingPct = total ? Math.round(((stats?.pendingDocuments || 0) * 100) / total) : 0
              const errorPct = total ? Math.round(((stats?.errorDocuments || 0) * 100) / total) : 0
              const successRate = analytics?.stats.successRate ?? (total ? Math.round(((total - (stats?.errorDocuments || 0)) * 100) / total) : 0)
              const metrics = [
                { name: t('admin.successRate'), value: successRate },
                { name: t('admin.processed'), value: processedPct },
                { name: t('admin.pending'), value: pendingPct },
                { name: t('admin.errors'), value: errorPct }
              ]
              return metrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#64c7cd] rounded-full"></div>
                      <span className="text-sm text-black">{metric.name}</span>
                    </div>
                    <span className="text-sm font-medium text-black">{metric.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-[#64c7cd] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">{t('admin.recentActivity')}</h3>
              <p className="text-sm text-black">{t('admin.lastActions')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#a5cc55] rounded-full animate-pulse"></div>
              <span className="text-xs text-black">{t('admin.realTime')}</span>
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)} animate-pulse`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">{activity.message}</p>
                  <p className="text-xs text-black">{activity.time}</p>
                </div>
                <div className="text-black/60">
                  {getStatusIcon(activity.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}