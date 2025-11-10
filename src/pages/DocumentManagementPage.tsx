import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Download,
  Search,
  Eye,
  Clock,
  Calendar,
  User,
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { adminApi } from '../services/api'
import { API_URL } from '../config/api.config'
import { DashboardSkeleton } from '../components/Skeleton'

interface Document {
  id: string
  fileName: string
  uploader: string
  uploadDate: string
  status: 'Procesando' | 'Completado' | 'Error' | 'Pendiente de revisión'
  fileSize: string
  documentType: string
  extractedData: {
    rfc: string
    periodo: string
    monto: string
  }
}

export const DocumentManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'All' | 'Procesando' | 'Completado' | 'Error' | 'Pendiente de revisión'>('All')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  } | null>(null)

  // Custom Dropdown Component
  const CustomDropdown: React.FC<{
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder: string
    isOpen: boolean
    onToggle: () => void
    className?: string
  }> = ({ value, onChange, options, placeholder, isOpen, onToggle, className = '' }) => {
    const selectedOption = options.find(option => option.value === value)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      if (!isOpen) return
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          onToggle()
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }, [isOpen, onToggle])

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-4 py-3 bg-white border border-[#64c7cd]/30 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300 hover:bg-[#64c7cd]/5 flex items-center justify-between"
        >
          <span className="text-left">{selectedOption?.label || placeholder}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-[#64c7cd]/30 rounded-xl shadow-2xl overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  onToggle()
                }}
                className={`w-full px-4 py-3 text-left text-black hover:bg-[#64c7cd]/10 transition-colors duration-200 ${value === option.value ? 'bg-white/20' : ''
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleExportDocuments = () => {
    // Prepare data for Excel export
    const excelData = [
      ['Archivo', 'Subido por', 'Fecha', 'Estado', 'Tipo', 'RFC', 'Período', 'Monto'],
      ...documents.map(doc => [
        doc.fileName,
        doc.uploader,
        doc.uploadDate,
        doc.status,
        doc.documentType,
        doc.extractedData.rfc,
        doc.extractedData.periodo,
        doc.extractedData.monto
      ])
    ]

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Documentos')

    // Generate Excel file and download
    XLSX.writeFile(wb, 'documentos.xlsx')
  }

  const handleViewDocument = async (document: Document) => {
    setSelectedDocument(document)
    setShowPdfModal(true)
    setPdfLoading(true)
    setPdfError(null)
    
    try {
      // Clean up previous PDF URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }

      // Fetch PDF blob
      const blob = await adminApi.downloadDocument(document.id)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setPdfError('No se pudo cargar el PDF. Por favor, intente descargarlo.')
    } finally {
      setPdfLoading(false)
    }
  }

  // Cleanup PDF URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/documents/processed/${doc.id}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const blob = await response.blob()

      // Prefer backend-provided filename
      let filename: string | undefined
      const cd = response.headers.get('content-disposition')
      if (cd) {
        const m = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (m && m[1]) filename = m[1].replace(/['"]/g, '')
      }
      // Fallback to RFC prefix if available
      if (!filename) {
        const rfc = (doc as any)?.extractedData?.rfc
        const prefix = rfc && typeof rfc === 'string' && rfc.length >= 4 ? rfc.slice(0, 4).toUpperCase() : 'XXXX'
        filename = `${prefix}_document.pdf`
      }

      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setFeedback({
        type: 'error',
        title: 'Error al Descargar',
        message: 'Error al descargar el PDF. Por favor, intente nuevamente.'
      })
    }
  }

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document)
    setSelectedDocuments([document.id]) // Set single document for deletion
    setShowDeleteModal(true)
  }

  const handleToggleDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleToggleAllDocuments = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      // Deselect all
      setSelectedDocuments([])
    } else {
      // Select all
      setSelectedDocuments(filteredDocuments.map(doc => doc.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedDocuments.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmDeleteDocument = async () => {
    if (selectedDocuments.length === 0) return

    setIsDeleting(true)
    try {
      // Use admin API to delete documents (works for both single and bulk)
      const result = await adminApi.deleteDocuments(selectedDocuments)
      
      // Close modal and refresh documents
      setShowDeleteModal(false)
      setSelectedDocument(null)
      setSelectedDocuments([]) // Clear selection
      await fetchDocuments()
      
      // Show success message
      setFeedback({
        type: 'success',
        title: 'Documento(s) Eliminado(s)',
        message: `${result.deletedCount} documento(s) eliminado(s) exitosamente.`
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      setFeedback({
        type: 'error',
        title: 'Error al Eliminar',
        message: 'Error al eliminar el documento. Por favor, intente nuevamente.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const pageSize = 5

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm, filterStatus])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const status = filterStatus === 'All' ? undefined : filterStatus
      const search = searchTerm || undefined

      const response = await adminApi.getDocuments(currentPage, pageSize, search, status)

      // Convert AdminDocument to Document format
      const convertedDocuments: Document[] = response.items.map(adminDoc => ({
        id: adminDoc.id,
        fileName: adminDoc.fileName,
        uploader: adminDoc.uploader,
        uploadDate: adminDoc.uploadDate,
        status: adminDoc.status as 'Procesando' | 'Completado' | 'Error' | 'Pendiente de revisión',
        fileSize: adminDoc.fileSize,
        documentType: adminDoc.documentType,
        extractedData: {
          rfc: adminDoc.extractedData.rfc,
          periodo: adminDoc.extractedData.periodo,
          monto: adminDoc.extractedData.monto
        }
      }))

      setDocuments(convertedDocuments)
      setTotalDocuments(response.totalCount)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtering is handled server-side, so we use documents directly
  const filteredDocuments = documents

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'text-green-400 bg-green-400/20'
      case 'Procesando': return 'text-blue-400 bg-blue-400/20'
      case 'Error': return 'text-red-400 bg-red-400/20'
      case 'Pendiente de revisión': return 'text-yellow-400 bg-yellow-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completado': return <CheckCircle className="h-4 w-4" />
      case 'Procesando': return <Clock className="h-4 w-4" />
      case 'Error': return <AlertCircle className="h-4 w-4" />
      case 'Pendiente de revisión': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Factura': return 'text-purple-400 bg-purple-400/20'
      case 'Recibo': return 'text-blue-400 bg-blue-400/20'
      case 'Extracto': return 'text-green-400 bg-green-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="p-6 px-20">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 px-20">
      {/* Feedback Modal */}
      {feedback && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFeedback(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-md sm:max-w-lg p-6 relative">
            <button
              onClick={() => setFeedback(null)}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-5 w-5 text-black hover:text-black" />
            </button>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl ${
                feedback.type === 'success' ? 'bg-green-500' : feedback.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {feedback.type === 'success' && <CheckCircle className="h-5 w-5 text-black" />}
                {feedback.type === 'error' && <AlertCircle className="h-5 w-5 text-black" />}
                {feedback.type === 'info' && <AlertCircle className="h-5 w-5 text-black" />}
              </div>
              <div>
                <h4 className="text-black text-lg font-semibold mb-1">{feedback.title}</h4>
                <p className="text-black text-sm">{feedback.message}</p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setFeedback(null)}
                className="px-5 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Gestión de Documentos</h2>
          <p className="text-sm text-black">Administrar documentos procesados y pendientes ({totalDocuments} documentos)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportDocuments}
            className="flex items-center px-4 py-2 text-sm font-medium text-black bg-[#64c7cd]/10 border border-[#64c7cd]/30 rounded-lg hover:bg-[#64c7cd]/20 hover:border-[#64c7cd]/40 transition-all duration-300 hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Exportar</span>
          </button>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black font-medium mb-1">Total Documentos</p>
              <p className="text-2xl font-bold text-black">{documents.length}</p>
            </div>
            <div className="p-3 bg-[#64c7cd] rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black font-medium mb-1">Procesados</p>
              <p className="text-2xl font-bold text-black">{documents.filter(d => d.status === 'Completado').length}</p>
            </div>
            <div className="p-3 bg-[#a5cc55] rounded-xl">
              <FileCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black font-medium mb-1">En Proceso</p>
              <p className="text-2xl font-bold text-black">{documents.filter(d => d.status === 'Procesando').length}</p>
            </div>
            <div className="p-3 bg-[#eb3089] rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black font-medium mb-1">Con Errores</p>
              <p className="text-2xl font-bold text-black">{documents.filter(d => d.status === 'Error').length}</p>
            </div>
            <div className="p-3 bg-[#eb3089] rounded-xl">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-[#64c7cd]/40 p-6 mb-6">
        <div className="flex flex-col md:flex-row sm:flex-row lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#64c7cd]/30 rounded-xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <CustomDropdown
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as 'All' | 'Completado' | 'Error')}
              options={[
                { value: 'All', label: 'Todos los estados' },
                { value: 'Completado', label: 'Completados' },
                { value: 'Error', label: 'Con Errores' }
              ]}
              placeholder="Seleccionar estado"
              isOpen={showStatusDropdown}
              onToggle={() => {
                setShowStatusDropdown(!showStatusDropdown)
              }}
            />
          </div>
        </div>
      </div>

      {/* Bulk Delete Button */}
      {selectedDocuments.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[#64c7cd]/10 rounded-xl p-4 border border-[#64c7cd]/30">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-black">
              {selectedDocuments.length} documento(s) seleccionado(s)
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">Eliminar Seleccionados</span>
          </button>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-2xl shadow-2xl hover:shadow-lg border border-[#64c7cd]/30 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#64c7cd]/15 border-b border-[#64c7cd]/30">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={filteredDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length}
                    onChange={handleToggleAllDocuments}
                    className="w-4 h-4 text-[#64c7cd] border-gray-300 rounded focus:ring-[#64c7cd] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Documento</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Subido por</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Datos Extraídos</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-black mb-1">No hay documentos</p>
                      <p className="text-sm text-black/60">No se encontraron documentos con los filtros aplicados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleToggleDocument(doc.id)}
                      className="w-4 h-4 text-[#64c7cd] border-gray-300 rounded focus:ring-[#64c7cd] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[#64c7cd] rounded-lg">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{doc.fileName}</p>
                        <p className="text-xs text-black/60">{doc.fileSize}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.documentType)}`}>
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      <span className="ml-1">{doc.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-[#64c7cd] rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-black">{doc.uploader}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-black">{new Date(doc.uploadDate).toLocaleDateString('es-MX')}</p>
                    <p className="text-xs text-black/60">{new Date(doc.uploadDate).toLocaleTimeString('es-MX')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-black">{doc.extractedData.rfc}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 text-black hover:text-black" />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 group"
                      >
                        <Download className="h-4 w-4 text-black hover:text-blue-600 group-hover:text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200 group"
                      >
                        <Trash2 className="h-4 w-4 text-black hover:text-red-600 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-black mb-1">No hay documentos</p>
                <p className="text-sm text-black/60">No se encontraron documentos con los filtros aplicados</p>
              </div>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
            <div key={doc.id} className="p-4 border-b border-[#64c7cd]/20 last:border-b-0 hover:bg-[#64c7cd]/5 transition-colors duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#64c7cd] rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{doc.fileName}</p>
                    <p className="text-xs text-black/60">{doc.fileSize}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4 text-black" />
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 text-black" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200 group"
                  >
                    <Trash2 className="h-4 w-4 text-black hover:text-red-600 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-black/60 mb-1">Tipo</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.documentType)}`}>
                    {doc.documentType}
                  </span>
                </div>
                <div>
                  <p className="text-black/60 mb-1">Estado</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {getStatusIcon(doc.status)}
                    <span className="ml-1">{doc.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-black/60 mb-1">Subido por</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#64c7cd] rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-black">{doc.uploader}</span>
                  </div>
                </div>
                <div>
                  <p className="text-black/60 mb-1">Fecha</p>
                  <p className="text-black">{new Date(doc.uploadDate).toLocaleDateString('es-MX')}</p>
                  <p className="text-black/60">{new Date(doc.uploadDate).toLocaleTimeString('es-MX')}</p>
                </div>
                <div>
                  <p className="text-black/60 mb-1">RFC</p>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-3 w-3 text-[#64c7cd]" />
                    <span className="text-black">{doc.extractedData.rfc}</span>
                  </div>
                </div>
                <div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-[#a5cc55]" />
                      <span className="text-black">{doc.extractedData.periodo}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-[#eb3089]" />
                      <span className="text-black">{doc.extractedData.monto}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalDocuments > pageSize && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 p-4">
          <div className="text-sm text-black">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalDocuments)} de {totalDocuments} documentos
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-1 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#64c7cd] text-white hover:bg-[#64c7cd]/80 hover:scale-105'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, Math.ceil(totalDocuments / pageSize)) }, (_, i) => {
                const totalPages = Math.ceil(totalDocuments / pageSize)
                let pageNum: number
                
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      currentPage === pageNum
                        ? 'bg-[#64c7cd] text-white'
                        : 'bg-white text-black border border-[#64c7cd]/30 hover:bg-[#64c7cd]/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalDocuments / pageSize), prev + 1))}
              disabled={currentPage >= Math.ceil(totalDocuments / pageSize)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-1 ${
                currentPage >= Math.ceil(totalDocuments / pageSize)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#64c7cd] text-white hover:bg-[#64c7cd]/80 hover:scale-105'
              }`}
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDocuments.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false)
              setSelectedDocuments([])
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-md sm:max-w-lg p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedDocuments([])
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black hover:text-black" />
            </button>

            <div className="mb-4 sm:mb-6 pr-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-[#eb3089] rounded-xl">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-black">Confirmar Eliminación</h3>
              </div>
              <p className="text-xs sm:text-sm text-black">Esta acción no se puede deshacer</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 bg-[#eb3089]/10 border border-[#eb3089]/40 rounded-xl shadow-sm">
                <p className="text-sm text-black mb-2">
                  {selectedDocuments.length === 1 
                    ? `¿Estás seguro de que quieres eliminar este documento?`
                    : `¿Estás seguro de que quieres eliminar ${selectedDocuments.length} documentos?`
                  }
                </p>
                <p className="text-xs text-black">
                  {selectedDocuments.length === 1
                    ? 'Se eliminará permanentemente del sistema, incluyendo todos los datos asociados.'
                    : 'Se eliminarán permanentemente del sistema, incluyendo todos los datos asociados.'
                  }
                </p>
              </div>

              {selectedDocument && (
                <div className="p-3 bg-white rounded-xl border border-[#64c7cd]/20 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#64c7cd] rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{selectedDocument.fileName}</p>
                      <p className="text-xs text-black">{selectedDocument.documentType} • {selectedDocument.fileSize}</p>
                      <p className="text-xs text-black">Subido por: {selectedDocument.uploader}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedDocuments([])
                }}
                disabled={isDeleting}
                className="px-4 sm:px-6 py-2 text-sm font-medium text-black bg-white border border-[#64c7cd]/40 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-sm order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteDocument}
                disabled={isDeleting}
                className={`px-4 sm:px-6 py-2 text-sm font-medium text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg order-1 sm:order-2 ${
                  isDeleting 
                    ? 'bg-[#eb3089]/50 cursor-not-allowed' 
                    : 'bg-[#eb3089] hover:bg-[#eb3089]/80'
                }`}
              >
                {isDeleting 
                  ? 'Eliminando...' 
                  : selectedDocuments.length === 1 
                    ? 'Eliminar Documento' 
                    : `Eliminar ${selectedDocuments.length} Documentos`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {showPdfModal && selectedDocument && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
                setPdfUrl(null)
              }
              setShowPdfModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-6xl h-[90vh] p-4 sm:p-6 relative flex flex-col">
            <button
              onClick={() => {
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl)
                  setPdfUrl(null)
                }
                setShowPdfModal(false)
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 z-10"
            >
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black hover:text-black" />
            </button>

            {/* Header */}
            <div className="mb-4 sm:mb-6 pr-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-[#64c7cd] rounded-xl">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">{selectedDocument.fileName}</h3>
                  <p className="text-xs sm:text-sm text-black">
                    {selectedDocument.documentType} • {selectedDocument.fileSize} • Subido por {selectedDocument.uploader}
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 rounded-xl p-4 overflow-hidden border border-gray-300">
              {pdfLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-black">Cargando PDF...</p>
                  </div>
                </div>
              ) : pdfError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <p className="text-black mb-2">{pdfError}</p>
                    <button
                      onClick={() => selectedDocument && handleViewDocument(selectedDocument)}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#64c7cd] rounded-xl hover:bg-[#64c7cd]/80 transition-all duration-300"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="PDF Preview"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-black mb-2">No se pudo cargar el PDF</p>
                  </div>
                </div>
              )}
            </div>

            {/* Document Info */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-black/60 mb-1">Estado : </span>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedDocument.status === 'Completado' ? 'text-green-400 bg-green-400/20' :
                  selectedDocument.status === 'Procesando' ? 'text-blue-400 bg-blue-400/20' :
                    selectedDocument.status === 'Error' ? 'text-red-400 bg-red-400/20' :
                      'text-yellow-400 bg-yellow-400/20'
                  }`}>
                  {selectedDocument.status === 'Completado' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {selectedDocument.status === 'Procesando' && <Clock className="h-3 w-3 mr-1" />}
                  {selectedDocument.status === 'Error' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {selectedDocument.status === 'Pendiente de revisión' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {selectedDocument.status}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-black mb-1">RFC  :  </span>
                <span className="text-sm text-black">{selectedDocument.extractedData.rfc}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
