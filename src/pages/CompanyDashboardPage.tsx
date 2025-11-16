import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Download,
  Eye,
  Search,
  Building,
  User,
  Calendar,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CompanyNotificationBell } from '../components/CompanyNotificationBell'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { API_URL } from '../config/api.config'

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

export const CompanyDashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [documents, setDocuments] = useState<ReceivedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ReceivedDocument | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<ReceivedDocument | null>(null)
  const [deleting, setDeleting] = useState(false)
  const pageSize = 10

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

  const handleViewPdf = async (doc: ReceivedDocument) => {
    try {
      setPdfLoading(true)
      setSelectedDocument(doc)
      setShowPdfModal(true)
      
      const response = await fetch(`${API_URL}/documents/processed/${doc.id}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.uploadError') }))
        throw new Error(errorData.message || t('errors.uploadError'))
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (error: any) {
      console.error('Error loading PDF:', error)
      setErrorMessage(error.message || t('errors.tryAgain'))
      setShowErrorModal(true)
      setShowPdfModal(false)
      setPdfLoading(false)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`${API_URL}/documents/processed/${documentId}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('company.errorDownloadingPDF') }))
        throw new Error(errorData.message || t('company.errorDownloadingPDF'))
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading document:', error)
      setErrorMessage(error.message || t('company.errorDownloadingDocument'))
      setShowErrorModal(true)
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

  const handleShowDeleteModal = (doc: ReceivedDocument) => {
    setDocumentToDelete(doc)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`${API_URL}/companies/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('company.delete') }))
        throw new Error(errorData.message || t('company.errorDeletingDocument'))
      }

      // Success - refresh documents
      setShowDeleteModal(false)
      setDocumentToDelete(null)
      await fetchDocuments()
      
      // Show success message (you can add a success modal if needed)
      console.log('Document deleted successfully')
    } catch (error: any) {
      console.error('Error deleting document:', error)
      setErrorMessage(error.message || t('company.errorDeletingDocument'))
      setShowErrorModal(true)
      setShowDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredDocuments.length / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-[#eb3089] rounded-xl">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">{t('company.companyDashboard')}</h1>
                <p className="text-sm text-black/60">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <CompanyNotificationBell />
              <button
                onClick={logout}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#eb3089]/10 hover:border-[#eb3089]/30 border border-transparent transition-all duration-300 group"
              >
                <div className="p-2 rounded-lg bg-[#eb3089]/10 group-hover:bg-[#eb3089]/20">
                  <LogOut className="h-4 w-4 !text-rose-500" />
                </div>
                <span className="text-sm font-medium !text-rose-500 hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/60 mb-1">{t('company.totalReceived')}</p>
                <p className="text-2xl font-bold text-black">{documents.length}</p>
              </div>
              <div className="p-3 bg-[#64c7cd] rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/60 mb-1">{t('company.today')}</p>
                <p className="text-2xl font-bold text-black">
                  {documents.filter(d => {
                    const today = new Date().toDateString()
                    return new Date(d.sentAt).toDateString() === today
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-[#a5cc55] rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/60 mb-1">{t('company.activeClients')}</p>
                <p className="text-2xl font-bold text-black">
                  {new Set(documents.map(d => d.clientEmail)).size}
                </p>
              </div>
              <div className="p-3 bg-[#eb3089] rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/60" />
            <input
              type="text"
              placeholder={t('company.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#64c7cd]/30 rounded-xl text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#64c7cd] focus:border-transparent"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#64c7cd]/15 border-b border-[#64c7cd]/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.document')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.client')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.dateReceived')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.extractedRFC')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">{t('company.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-black/60">
                      {t('company.loadingDocuments')}
                    </td>
                  </tr>
                ) : paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-black/60">{t('company.noDocumentsReceived')}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#64c7cd] rounded-lg">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-black/60" />
                          <span className="text-sm text-black">{doc.clientEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-black">{new Date(doc.sentAt).toLocaleDateString('es-MX')}</p>
                        <p className="text-xs text-black/60">{new Date(doc.sentAt).toLocaleTimeString('es-MX')}</p>
                      </td>
                      <td className="px-6 py-4">
                        {doc.extractedData?.rfc && (
                          <div className="flex items-center space-x-2">
                            <Shield className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-black">{doc.extractedData.rfc}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPdf(doc)}
                            className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                            title={t('company.viewPDF')}
                          >
                            <Eye className="h-4 w-4 text-black hover:text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title={t('company.download')}
                          >
                            <Download className="h-4 w-4 text-black hover:text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleShowDeleteModal(doc)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title={t('company.delete')}
                          >
                            <Trash2 className="h-4 w-4 text-black hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-black/60">
                {t('company.showing')} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredDocuments.length)} {t('company.of')} {filteredDocuments.length}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 text-black" />
                </button>
                <span className="text-sm text-black">
                  {t('company.page')} {currentPage} {t('company.of')} {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4 text-black" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPdfModal && selectedDocument && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPdfModal(false)
              setSelectedDocument(null)
              if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
                setPdfUrl(null)
              }
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#eb3089]/30 w-full max-w-6xl h-[90vh] flex flex-col relative">
            <button
              onClick={() => {
                setShowPdfModal(false)
                setSelectedDocument(null)
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl)
                  setPdfUrl(null)
                }
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 z-10"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between pr-10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#eb3089] rounded-xl">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">{selectedDocument.fileName}</h3>
                    <p className="text-sm text-black/60">{t('company.client')}: {selectedDocument.clientEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedDocument.id, selectedDocument.fileName)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#64c7cd] rounded-xl hover:bg-[#64c7cd]/80 transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('company.download')}</span>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-6 overflow-hidden">
              {pdfLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-black">{t('company.loadingPDF')}</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-black mb-2">{t('company.couldNotLoadPDF')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && documentToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false)
              setDocumentToDelete(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setDocumentToDelete(null)
              }}
              disabled={deleting}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">{t('company.confirmDeletion')}</h3>
              </div>

              <p className="text-sm text-black/70 mb-4">
                {t('company.confirmDeleteMessage')}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-black mb-1">{documentToDelete.fileName}</p>
                <p className="text-xs text-black/60 mb-1">{t('company.client')}: {documentToDelete.clientEmail}</p>
                <p className="text-xs text-red-600 font-medium mt-2">{t('company.cannotUndo')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDocumentToDelete(null)
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
                {deleting ? t('company.deleting') : t('company.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowErrorModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <XCircle className="h-5 w-5 text-black" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-black">{t('company.error')}</h3>
              </div>

              <p className="text-sm text-black/70">
                {errorMessage}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {t('company.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

