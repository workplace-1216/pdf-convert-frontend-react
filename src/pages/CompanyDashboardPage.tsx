import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react'
import { API_URL } from '../config/api.config'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface ReceivedDocument {
  id: number
  fileName: string
  clientEmail: string
  sentAt: string
  extractedData: {
    rfc?: string
    [key: string]: any
  }
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const CompanyDashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<ReceivedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/companies/received-documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.somethingWentWrong') }))
        console.error('Error response:', response.status, errorData)
        throw new Error(errorData.message || 'Failed to fetch documents')
      }

      const data = await response.json()
      console.log('[CompanyDashboard] Received documents:', data.documents?.length || 0)
      setDocuments(data.documents || [])
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      console.error('Error message:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Chart data processing
  const chartData = useMemo(() => {
    if (documents.length === 0) return []

    const now = new Date()
    const dataMap = new Map<string, number>()

    // Process documents based on time period
    documents.forEach(doc => {
      const docDate = new Date(doc.sentAt)
      let key: string

      switch (timePeriod) {
        case 'daily':
          key = docDate.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(docDate)
          weekStart.setDate(docDate.getDate() - docDate.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}`
          break
        case 'yearly':
          key = String(docDate.getFullYear())
          break
      }

      dataMap.set(key, (dataMap.get(key) || 0) + 1)
    })

    // Generate complete date range
    const result: { date: string; documents: number }[] = []
    let periodsToShow: number

    switch (timePeriod) {
      case 'daily':
        periodsToShow = 30
        for (let i = periodsToShow - 1; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(now.getDate() - i)
          const key = date.toISOString().split('T')[0]
          result.push({
            date: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
            documents: dataMap.get(key) || 0
          })
        }
        break

      case 'weekly':
        periodsToShow = 12
        for (let i = periodsToShow - 1; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(now.getDate() - (i * 7))
          date.setDate(date.getDate() - date.getDay())
          const key = date.toISOString().split('T')[0]
          result.push({
            date: t('company.weekOf') + ' ' + date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
            documents: dataMap.get(key) || 0
          })
        }
        break

      case 'monthly':
        periodsToShow = 12
        for (let i = periodsToShow - 1; i >= 0; i--) {
          const date = new Date(now)
          date.setMonth(now.getMonth() - i)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          result.push({
            date: date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
            documents: dataMap.get(key) || 0
          })
        }
        break

      case 'yearly':
        periodsToShow = 5
        for (let i = periodsToShow - 1; i >= 0; i--) {
          const year = now.getFullYear() - i
          const key = String(year)
          result.push({
            date: String(year),
            documents: dataMap.get(key) || 0
          })
        }
        break
    }

    return result
  }, [documents, timePeriod, t])

  // Client distribution data for pie chart
  const clientDistributionData = useMemo(() => {
    const clientCounts = new Map<string, number>()

    documents.forEach(doc => {
      const email = doc.clientEmail
      clientCounts.set(email, (clientCounts.get(email) || 0) + 1)
    })

    return Array.from(clientCounts.entries())
      .map(([email, count]) => ({
        name: email,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 clients
  }, [documents])

  // Top clients bar chart data
  const topClientsData = useMemo(() => {
    const clientCounts = new Map<string, number>()

    documents.forEach(doc => {
      const email = doc.clientEmail
      clientCounts.set(email, (clientCounts.get(email) || 0) + 1)
    })

    return Array.from(clientCounts.entries())
      .map(([email, count]) => ({
        client: email.split('@')[0], // Show only username part
        documents: count,
        fullEmail: email
      }))
      .sort((a, b) => b.documents - a.documents)
      .slice(0, 5) // Top 5 clients
  }, [documents])

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, 5)
  }, [documents])

  // Chart colors
  const COLORS = ['#64c7cd', '#eb3089', '#a5cc55', '#f59e0b', '#8b5cf6']

  return (
    <>
    <div className="p-6 px-20">
        {/* Charts Section */}
        <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-1">{t('company.documentsOverTime')}</h2>
              <p className="text-sm text-black/60">{t('company.statistics')}</p>
            </div>
            <div className="flex items-center space-x-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    timePeriod === period
                      ? 'bg-[#64c7cd] text-white shadow-md'
                      : 'bg-gray-100 text-black/60 hover:bg-gray-200'
                  }`}
                >
                  {t(`company.${period}`)}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDocuments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64c7cd" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#64c7cd" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #64c7cd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: '#000', fontWeight: 'bold' }}
                  formatter={(value: number) => [value, t('company.documents')]}
                />
                <Area
                  type="monotone"
                  dataKey="documents"
                  stroke="#64c7cd"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDocuments)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('company.noDataAvailable')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Client Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Documents by Client - Pie Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#eb3089] rounded-lg">
                <PieChartIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{t('company.documentsByClient')}</h2>
                <p className="text-sm text-black/60">{t('company.clientDistribution')}</p>
              </div>
            </div>

            {clientDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split('@')[0]}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #64c7cd',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center text-gray-400">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('company.noDataAvailable')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Clients - Bar Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#a5cc55] rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{t('company.topClients')}</h2>
                <p className="text-sm text-black/60">{t('company.mostActive')}</p>
              </div>
            </div>

            {topClientsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClientsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="client"
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #64c7cd',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: '#000', fontWeight: 'bold' }}
                    formatter={(value: number, name: string, props: any) => [
                      value,
                      `${t('company.documents')} (${props.payload.fullEmail})`
                    ]}
                  />
                  <Bar dataKey="documents" fill="#64c7cd" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center text-gray-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('company.noDataAvailable')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-[#64c7cd] rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">{t('company.recentActivity')}</h2>
              <p className="text-sm text-black/60">{t('company.latestDocuments')}</p>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-[#64c7cd]/5 hover:to-white transition-all duration-200 border border-gray-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-[#64c7cd] rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{doc.fileName}</p>
                      <div className="flex items-center space-x-3 text-sm text-black/60 mt-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{doc.clientEmail}</span>
                        </div>
                        {doc.extractedData?.rfc && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">RFC:</span>
                            <span className="font-mono">{doc.extractedData.rfc}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">
                        {new Date(doc.sentAt).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </p>
                      <p className="text-xs text-black/60">
                        {new Date(doc.sentAt).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-[#64c7cd]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('company.noRecentActivity')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
