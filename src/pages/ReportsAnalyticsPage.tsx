import React, { useEffect, useState } from 'react'
import {
  Download,
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import * as XLSX from 'xlsx'
import { adminApi } from '../services/api'
import type { ReportsAnalyticsResponse } from '../types/api'
import { DashboardSkeleton } from '../components/Skeleton'

// Pie colors mapping
const TYPE_COLORS: string[] = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export const ReportsAnalyticsPage: React.FC = () => {
  const [selectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [data, setData] = useState<ReportsAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async (period: '7d' | '30d' | '90d' | '1y') => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminApi.getAnalytics(period)
      setData(res)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(selectedPeriod)
  }, [])

  // Removed manual refresh; data auto-loads on mount

  const handleExportReports = () => {
    // Prepare data for Excel export with multiple sheets
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Key Metrics
    const metricsData = [
      ['Métrica', 'Valor', 'Período'],
      ['Total Documentos', (data?.stats.totalDocuments ?? 0).toString(), selectedPeriod],
      ['Documentos Hoy', (data?.stats.processedToday ?? 0).toString(), selectedPeriod],
      ['Tiempo Promedio', data?.stats.averageProcessingTime ?? '-', selectedPeriod],
      ['Tasa de Éxito', `${data?.stats.successRate ?? 0}%`, selectedPeriod],
      ['Total Usuarios', (data?.stats.totalUsers ?? 0).toString(), selectedPeriod],
      ['Usuarios Activos', (data?.stats.activeUsers ?? 0).toString(), selectedPeriod],
      ['Tasa de Crecimiento', `${data?.stats.growthRate ?? 0}%`, selectedPeriod]
    ]
    const metricsWs = XLSX.utils.aoa_to_sheet(metricsData)
    XLSX.utils.book_append_sheet(wb, metricsWs, 'Métricas Clave')
    
    // Sheet 2: Monthly Trends
    const trendsData = [
      ['Mes', 'Documentos', 'Procesados', 'Enviados', 'Errores'],
      ...((data?.monthlyTrends || []).map(item => [
        item.month,
        item.documents.toString(),
        item.processed.toString(),
        (item.sent || 0).toString(),
        item.errors.toString()
      ]))
    ]
    const trendsWs = XLSX.utils.aoa_to_sheet(trendsData)
    XLSX.utils.book_append_sheet(wb, trendsWs, 'Tendencias Mensuales')
    
    // Sheet 3: User Activity
    const activityData = [
      ['Hora', 'Usuarios', 'Documentos'],
      ...((data?.userActivity || []).map(item => [
        item.time,
        item.users.toString(),
        item.documents.toString()
      ]))
    ]
    const activityWs = XLSX.utils.aoa_to_sheet(activityData)
    XLSX.utils.book_append_sheet(wb, activityWs, 'Actividad de Usuarios')
    
    // Sheet 4: Document Types
    const typesData = [
      ['Tipo', 'Cantidad'],
      ...((data?.documentTypes || []).map(item => [
        item.name,
        item.value.toString()
      ]))
    ]
    const typesWs = XLSX.utils.aoa_to_sheet(typesData)
    XLSX.utils.book_append_sheet(wb, typesWs, 'Tipos de Documentos')
    
    // Generate Excel file and download
    XLSX.writeFile(wb, `reportes_${selectedPeriod}.xlsx`)
  }

  if (loading && !data) {
    return (
      <div className="p-6 px-20">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 px-20">
        <div className="text-red-300">{error}</div>
      </div>
    )
  }


  return (
    <div className="p-6 px-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Reportes y Analytics</h2>
          <p className="text-sm text-black">Análisis detallado del rendimiento del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportReports}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/50 rounded-lg hover:bg-[#64c7cd]/80 transition-all duration-300 hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#64c7cd] rounded-xl shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+{data?.stats.growthRate ?? 0}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">Total Documentos</p>
              <p className="text-2xl font-bold text-black">{data?.stats.totalDocuments.toLocaleString()}</p>
              <p className="text-xs text-black mt-2">+{data?.stats.processedToday} hoy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#a5cc55] rounded-xl shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+2.1%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-black">{data?.stats.successRate}%</p>
              <p className="text-xs text-black mt-2">Excelente rendimiento</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#eb3089] rounded-xl shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">-15%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-black">{data?.stats.averageProcessingTime}</p>
              <p className="text-xs text-black mt-2">Mejorando eficiencia</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#64c7cd] rounded-xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-black">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-black font-medium mb-1">Usuarios Activos</p>
              <p className="text-2xl font-bold text-black">{data?.stats.activeUsers}</p>
              <p className="text-xs text-black mt-2">de {data?.stats.totalUsers} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">Tendencias Mensuales</h3>
              <p className="text-sm text-black">Documentos, procesados, enviados y errores</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-xs text-black">Documentos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-xs text-black">Procesados</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-xs text-black">Enviados</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-xs text-black">Errores</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="month" stroke="rgba(0,0,0,0.6)" />
              <YAxis stroke="rgba(0,0,0,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="documents" stroke="#64c7cd" strokeWidth={2} name="Documentos" />
              <Line type="monotone" dataKey="processed" stroke="#a5cc55" strokeWidth={2} name="Procesados" />
              <Line type="monotone" dataKey="sent" stroke="#f97316" strokeWidth={2} name="Enviados" />
              <Line type="monotone" dataKey="errors" stroke="#eb3089" strokeWidth={2} name="Errores" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">Actividad de Usuarios</h3>
              <p className="text-sm text-black">Últimas 24 horas</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#a5cc55] rounded-full animate-pulse"></div>
              <span className="text-xs text-black">En tiempo real</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.userActivity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="time" stroke="rgba(0,0,0,0.6)" />
              <YAxis stroke="rgba(0,0,0,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
              <Area type="monotone" dataKey="users" stroke="#a5cc55" fill="rgba(165, 204, 85, 0.2)" />
              <Area type="monotone" dataKey="documents" stroke="#64c7cd" fill="rgba(100, 199, 205, 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">Tipos de Documentos</h3>
              <p className="text-sm text-black">Distribución actual</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={(data?.documentTypes || []).map((d, i) => ({ ...d, color: TYPE_COLORS[i % TYPE_COLORS.length] }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {(data?.documentTypes || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Processing Time */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">Tiempo de Procesamiento</h3>
              <p className="text-sm text-black">Distribución por rangos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.processingTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="range" stroke="rgba(0,0,0,0.6)" />
              <YAxis stroke="rgba(0,0,0,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: '1px solid rgba(100,199,205,0.4)',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
              <Bar dataKey="count" fill="#64c7cd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
