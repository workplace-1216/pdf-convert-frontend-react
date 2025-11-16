import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Download,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  XCircle,
  AlertCircle,
  Trash2,
  User,
  Calendar
} from 'lucide-react'
import { API_URL } from '../config/api.config'
import { Skeleton } from '../components/Skeleton'

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

export const CompanyDocumentsPage: React.FC = () => {
  const { t } = useTranslation()
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
      console.log('[CompanyDocuments] Received documents:', data.documents?.length || 0)
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
      console.error('Error viewing PDF:', error)
      setErrorMessage(error.message || t('errors.uploadError'))
      setShowErrorModal(true)
      setShowPdfModal(false)
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
        throw new Error(t('errors.uploadError'))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading document:', error)
      setErrorMessage(error.message || t('errors.uploadError'))
      setShowErrorModal(true)
    }
  }

  const confirmDeleteDocument = (doc: ReceivedDocument) => {
    setDocumentToDelete(doc)
    setShowDeleteModal(true)
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`${API_URL}/companies/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.deleteFailed') }))
        throw new Error(errorData.message || t('errors.deleteFailed'))
      }

      // Remove from local state
      setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id))
      setShowDeleteModal(false)
      setDocumentToDelete(null)
    } catch (error: any) {
      console.error('Error deleting document:', error)
      setErrorMessage(error.message || t('errors.deleteFailed'))
      setShowErrorModal(true)
    } finally {
      setDeleting(false)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.extractedData?.rfc && doc.extractedData.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredDocuments.length / pageSize)

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">{t('company.receivedDocuments')}</h1>
          <p className="text-sm text-black/60">
            {t('company.totalDocuments')}: {documents.length}
          </p>
        </div>

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

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-md border border-[#64c7cd]/30 overflow-hidden">
          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder={t('company.searchDocuments')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#64c7cd] text-black"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="space-y-4">
                <Skeleton variant="text" width="60%" height={24} className="mx-auto" />
                <Skeleton variant="text" width="40%" height={16} className="mx-auto" />
                <Skeleton count={3} />
              </div>
            </div>
          ) : paginatedDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">
                {searchTerm ? t('company.noSearchResults') : t('company.noDocuments')}
              </h3>
              <p className="text-sm text-black/60">
                {searchTerm ? t('company.tryDifferentSearch') : t('company.documentsWillAppear')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      {t('company.document')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      {t('company.client')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      RFC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      {t('company.receivedDate')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-black uppercase tracking-wider">
                      {t('company.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#64c7cd] rounded-lg">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-sm font-medium text-black">{doc.fileName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">{doc.clientEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black font-mono">
                          {doc.extractedData?.rfc || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {new Date(doc.sentAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewPdf(doc)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title={t('company.viewPdf')}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title={t('company.download')}
                          >
                            <Download className="h-4 w-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => confirmDeleteDocument(doc)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title={t('company.delete')}
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

          {/* Pagination */}
          {!loading && paginatedDocuments.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-black/60">
                {t('company.showing')} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredDocuments.length)} {t('company.of')} {filteredDocuments.length}
              </div>
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
      </div>
    </div>

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
                <p className="text-black/60">{t('errors.loadFailed')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && documentToDelete && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black">{t('company.confirmDeletion')}</h3>
            </div>

            <p className="text-sm text-black/70 mb-4">
              {t('company.confirmDeleteDocument')}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-black font-medium mb-1">
                {documentToDelete.fileName}
              </p>
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
              onClick={handleDeleteDocument}
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowErrorModal(false)
            setErrorMessage('')
          }
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
          <button
            onClick={() => {
              setShowErrorModal(false)
              setErrorMessage('')
            }}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XCircle className="h-5 w-5 text-black" />
          </button>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black">{t('errors.errorOccurred')}</h3>
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
    </>
  )
}
