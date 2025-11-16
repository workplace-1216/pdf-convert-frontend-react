import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckSquare,
  LogOut,
  Send,
  Trash2,
  Building
} from 'lucide-react'
import JSZip from 'jszip'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { documentApi } from '../services/api'
import { API_URL } from '../config/api.config'
import { Skeleton } from '../components/Skeleton'
import LanguageSwitcher from '../components/LanguageSwitcher'

// Types
interface ReadyDocument {
  id: string
  rfcEmisor: string
  periodo: string
  montoTotalMxn: string  // Backend returns as string
  proveedorEmail: string
  complianceStatus: string  // Backend returns "ListoParaEnviar"
  readyAtUtc: string
  uploadedAt?: string // legacy optional
  uploadedAtUtc?: string // prefer this from backend for batch grouping
  uploadBatchId?: string // server-provided batch id
  isSentToAdmin?: boolean
  isSentToCompany?: boolean
}

interface DocumentFolder {
  id: string
  folderName: string // Date and time string
  uploadDateTime: Date
  documents: ReadyDocument[]
  documentCount: number
}

// Modern Folder Component with SVG
const FolderCard: React.FC<{
  folder: DocumentFolder
  onFolderClick: (folder: DocumentFolder) => void
  onSelect: (folderId: string, selected: boolean) => void
  isSelected: boolean
}> = ({ folder, onFolderClick, onSelect, isSelected }) => {
  const { t } = useTranslation()

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl border border-[#64c7cd]/40 p-3 sm:p-4 md:p-6 hover:shadow-2xl hover:scale-[102%] transition-all duration-300 group ${isSelected ? 'ring-2 ring-[#eb3089]' : ''
        }`}
      onClick={(e) => {
        e.stopPropagation()
        onFolderClick(folder)
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect(folder.id, !isSelected)
        }}
        className="absolute top-3 right-3 z-10"
      >
        <CheckSquare
          className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isSelected ? 'text-[#eb3089] fill-current' : 'text-gray-400'
            }`}
        />
      </button>

      {/* Folder SVG Icon - Beautiful Windows-style */}
      <div
        className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4"
      >
        <svg
          viewBox="0 0 140 110"
          className="w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Windows Blue Folder Gradient */}
            <linearGradient id={`folderGradient-${folder.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#42a5f5" />
              <stop offset="30%" stopColor="#2196f3" />
              <stop offset="70%" stopColor="#1976d2" />
              <stop offset="100%" stopColor="#1565c0" />
            </linearGradient>
            {/* Windows Yellow Tab Gradient */}
            <linearGradient id={`folderTabGradient-${folder.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="50%" stopColor="#ffc107" />
              <stop offset="100%" stopColor="#ffb300" />
            </linearGradient>
            {/* Enhanced Shadow */}
            <filter id={`shadow-${folder.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
              <feOffset dx="3" dy="5" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Inner glow */}
            <filter id={`glow-${folder.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main folder body - Beautiful rounded Windows style */}
          <path
            d="M12 28 C12 20, 18 16, 26 16 L48 16 L54 26 L58 26 L58 94 C58 100, 54 104, 48 104 L18 104 C12 104, 8 100, 8 94 L8 28 Z"
            fill={`url(#folderGradient-${folder.id})`}
            filter={`url(#shadow-${folder.id})`}
            className="transition-all duration-300 group-hover:brightness-110"
          />

          {/* Folder tab - Beautiful Windows yellow */}
          <path
            d="M12 28 C12 20, 18 16, 26 16 L48 16 C50 16, 51.5 17.5, 52.5 19.5 L54 22.5 L54 26 L12 26 Z"
            fill={`url(#folderTabGradient-${folder.id})`}
            className="transition-all duration-300 group-hover:brightness-105"
            filter={`url(#glow-${folder.id})`}
          />

          {/* Top highlight on tab */}
          <path
            d="M12 28 C12 20, 18 16, 26 16 L48 16 C49.5 16, 50.5 17, 51.5 18.5 L52.5 20.5 L52.5 24 L14 24 L12 26 Z"
            fill="rgba(255,255,255,0.4)"
            opacity="0.6"
          />

          {/* Inner highlight for depth on folder */}
          <path
            d="M14 30 L14 92 C14 96, 16 98, 20 98 L46 98 L46 30 L26 30 C20 30, 16 30, 14 30 Z"
            fill="rgba(255,255,255,0.12)"
          />

          {/* Side shadow for 3D effect */}
          <path
            d="M8 28 L8 94 C8 100, 12 104, 18 104 L12 28 Z"
            fill="rgba(0,0,0,0.15)"
            opacity="0.3"
          />

          {/* Document count badge - Beautiful white circle */}
          <circle
            cx="68"
            cy="58"
            r="18"
            fill="rgba(255,255,255,0.98)"
            filter={`url(#shadow-${folder.id})`}
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.5"
          />
          <circle
            cx="68"
            cy="58"
            r="16"
            fill="rgba(33, 150, 243, 0.08)"
          />

          {/* Document count text - Beautiful blue */}
          <text
            x="68"
            y="64"
            textAnchor="middle"
            className="text-xl sm:text-2xl font-bold fill-[#1976d2] transition-colors duration-300"
            dominantBaseline="middle"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '700' }}
          >
            {folder.documentCount}
          </text>
        </svg>
      </div>

      {/* Folder Name */}
      <div className="text-center">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1 line-clamp-2">
          {folder.folderName}
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-500">
          {folder.documentCount} {folder.documentCount === 1 ? t('nav.documents').slice(0, -1) : t('nav.documents')}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}

// TransformationDrawer component removed - replaced with PDF preview modal

// Main Component - Compliance Verification Dashboard
export const ClientReadyDocumentsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [readyDocs, setReadyDocs] = useState<ReadyDocument[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: number; name: string; rfc: string; email: string }>>([])
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [showManageCompaniesModal, setShowManageCompaniesModal] = useState(false)
  const [myCompanies, setMyCompanies] = useState<Array<{ id: number; name: string; rfc: string; email: string }>>([])
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string; rfc: string; email: string }>>([])
  const [selectedNewCompanyIds, setSelectedNewCompanyIds] = useState<number[]>([])
  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<{ id: number; name: string } | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)
  const [folderPage, setFolderPage] = useState(1)
  const folderPageSize = 5
  const [feedbackModalContent, setFeedbackModalContent] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteFolderIds, setPendingDeleteFolderIds] = useState<string[]>([])
  // PDF Preview Modal state
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<ReadyDocument | null>(null)

  // Helper function to clean up regex patterns and show proper extracted values
  const getDisplayValue = (value: string, type: string) => {

    if (!value || value === "N/A" || value === "0") {
      return t('documents.noDocuments')
    }

    // Check if it's a regex pattern (contains [\s:]* or similar regex syntax)
    const isRegexPattern = value.includes("[\\s:]*") ||
      value.includes("([A-Z0-9]{12,13})") ||
      value.includes("([0-9]{2}/[0-9]{4})") ||
      value.includes("([0-9,]+\\.[0-9]{2})") ||
      value.includes("\\$?([0-9,]+\\.[0-9]{2})") ||
      value.includes("Total[\\s:]*\\$?") ||
      value.includes("Per[ií]odo[\\s:]*") ||
      value.includes("RFC[\\s:]*") ||
      value.includes("\\$?") ||
      value.includes("([0-9,]+") ||
      value.includes("\\.[0-9]{2})") ||
      value.includes("\\s:") ||
      value.includes("\\$") ||
      value.includes("([0-9") ||
      value.includes("\\.[0-9]")


    if (isRegexPattern) {
      // This is a regex pattern, show a placeholder indicating extraction is needed
      return t('documents.processing')
    }

    // Return the actual extracted value
    if (type === "MONTO" && value !== "0") {
      return `$${value} MXN`
    }

    return value
  }

  // Preview PDF function
  const handlePreviewDocument = async (doc: ReadyDocument) => {
    setPreviewDocument(doc)
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
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`${API_URL}/documents/client/documents/${doc.id}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setPdfError(t('errors.uploadError'))
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

  // Download function to properly handle PDF downloads
  const handleDownload = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showFeedback('error', t('errors.unauthorized'), t('errors.unauthorized'))
        return
      }

      const response = await fetch(`${API_URL}/documents/client/documents/${documentId}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Download error:', errorText)
        showFeedback('error', t('errors.uploadError'), t('errors.uploadError'))
        return
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('content-disposition')
      let filename: string | undefined
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      // Fallback: derive RFC-based name from current document metadata
      if (!filename) {
        const meta = readyDocs.find(d => d.id === documentId)
        const rfcPrefix = meta?.rfcEmisor ? meta.rfcEmisor.slice(0, 4).toUpperCase() : 'XXXX'
        filename = `${rfcPrefix}_document.pdf`
      }

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      // Trigger the download
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Download failed:', error)
      showFeedback('error', t('errors.uploadError'), t('errors.uploadError'))
    }
  }

  // Upload functionality
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ensure filename uniqueness within a ZIP folder to avoid overwrites
  const ensureUniqueFileName = (proposedName: string, usedNames: Set<string>): string => {
    if (!usedNames.has(proposedName)) {
      usedNames.add(proposedName)
      return proposedName
    }
    const dot = proposedName.lastIndexOf('.')
    const base = dot >= 0 ? proposedName.substring(0, dot) : proposedName
    const ext = dot >= 0 ? proposedName.substring(dot) : ''
    let counter = 2
    let candidate = `${base}-${counter}${ext}`
    while (usedNames.has(candidate)) {
      counter++
      candidate = `${base}-${counter}${ext}`
    }
    usedNames.add(candidate)
    return candidate
  }

  // Group documents into folders by upload batch (gap detection approach)
  // Each upload batch creates a new folder. A gap of more than 10 seconds between consecutive documents indicates a new batch
  const groupDocumentsIntoFolders = (documents: ReadyDocument[]): DocumentFolder[] => {
    if (!documents || documents.length === 0) return []

    // If backend provided batch ids, group strictly by them
    const hasBatchIds = documents.some(d => !!d.uploadBatchId)
    if (hasBatchIds) {
      const byBatch: Record<string, ReadyDocument[]> = {}
      for (const doc of documents) {
        const key = doc.uploadBatchId || `__no_batch__`
        if (!byBatch[key]) byBatch[key] = []
        byBatch[key].push(doc)
      }
      const folders: DocumentFolder[] = []
      Object.entries(byBatch).forEach(([batchId, batchDocs]) => {
        // Use earliest upload time in the batch for naming and ordering
        const earliest = batchDocs.reduce((min, d) => {
          const t = new Date(d.uploadedAtUtc ?? d.uploadedAt ?? d.readyAtUtc).getTime()
          return t < min ? t : min
        }, Number.POSITIVE_INFINITY)
        const uploadDateTime = new Date(earliest)
        const formattedName = `${String(uploadDateTime.getDate()).padStart(2, '0')}/${String(uploadDateTime.getMonth() + 1).padStart(2, '0')}/${uploadDateTime.getFullYear()} ${String(uploadDateTime.getHours()).padStart(2, '0')}:${String(uploadDateTime.getMinutes()).padStart(2, '0')}:${String(uploadDateTime.getSeconds()).padStart(2, '0')}`
        const folderId = `batch-${batchId}-${uploadDateTime.getTime()}`
        folders.push({
          id: folderId,
          folderName: formattedName,
          uploadDateTime,
          documents: batchDocs.sort((a,b) => new Date(a.readyAtUtc).getTime() - new Date(b.readyAtUtc).getTime()),
          documentCount: batchDocs.length
        })
      })
      return folders.sort((a,b) => b.uploadDateTime.getTime() - a.uploadDateTime.getTime())
    }

    // Fallback to time-gap grouping
    // Sort documents by original upload timestamp (prefer uploadedAtUtc, then uploadedAt, fallback to readyAtUtc)
    const sortedDocs = [...documents].sort((a, b) => 
      new Date(a.uploadedAtUtc ?? a.uploadedAt ?? a.readyAtUtc).getTime() - new Date(b.uploadedAtUtc ?? b.uploadedAt ?? b.readyAtUtc).getTime()
    )

    const folders: DocumentFolder[] = []
    const GAP_THRESHOLD_MS = 5000 // 5 seconds - if gap between consecutive docs > 5s, it's a new batch

    let currentBatch: ReadyDocument[] = []

    sortedDocs.forEach((doc) => {
      const docTime = new Date(doc.uploadedAtUtc ?? doc.uploadedAt ?? doc.readyAtUtc).getTime()

      if (currentBatch.length === 0) {
        // First document in a new batch
        currentBatch = [doc]
      } else {
        // Check the gap between the last document in current batch and this document
        const last = currentBatch[currentBatch.length - 1]
        const lastDocTime = new Date(last.uploadedAtUtc ?? last.uploadedAt ?? last.readyAtUtc).getTime()
        const gap = docTime - lastDocTime

        if (gap > GAP_THRESHOLD_MS) {
          // Significant gap detected - save current batch and start a new one
          const uploadDateTime = new Date(currentBatch[0].uploadedAtUtc ?? currentBatch[0].uploadedAt ?? currentBatch[0].readyAtUtc)
          const formattedName = `${String(uploadDateTime.getDate()).padStart(2, '0')}/${String(uploadDateTime.getMonth() + 1).padStart(2, '0')}/${uploadDateTime.getFullYear()} ${String(uploadDateTime.getHours()).padStart(2, '0')}:${String(uploadDateTime.getMinutes()).padStart(2, '0')}:${String(uploadDateTime.getSeconds()).padStart(2, '0')}`
          
          // Create stable folder ID based on first document ID and timestamp
          // This ensures the same folder always gets the same ID even after re-grouping
          const folderId = `folder-${currentBatch[0].id}-${uploadDateTime.getTime()}`
          
          folders.push({
            id: folderId,
            folderName: formattedName,
            uploadDateTime,
            documents: currentBatch,
            documentCount: currentBatch.length
          })

          // Start new batch
          currentBatch = [doc]
        } else {
          // Small gap - add to current batch
          currentBatch.push(doc)
        }
      }
    })

    // Don't forget the last batch
    if (currentBatch.length > 0) {
      const uploadDateTime = new Date(currentBatch[0].uploadedAtUtc ?? currentBatch[0].uploadedAt ?? currentBatch[0].readyAtUtc)
      const formattedName = `${String(uploadDateTime.getDate()).padStart(2, '0')}/${String(uploadDateTime.getMonth() + 1).padStart(2, '0')}/${uploadDateTime.getFullYear()} ${String(uploadDateTime.getHours()).padStart(2, '0')}:${String(uploadDateTime.getMinutes()).padStart(2, '0')}:${String(uploadDateTime.getSeconds()).padStart(2, '0')}`
      
      // Create stable folder ID based on first document ID and timestamp
      // This ensures the same folder always gets the same ID even after re-grouping
      const folderId = `folder-${currentBatch[0].id}-${uploadDateTime.getTime()}`
      
      folders.push({
        id: folderId,
        folderName: formattedName,
        uploadDateTime,
        documents: currentBatch,
        documentCount: currentBatch.length
      })
    }

    // Return folders sorted by most recent first
    return folders.sort((a, b) => b.uploadDateTime.getTime() - a.uploadDateTime.getTime())
  }

  // Fetch ready documents - fetch ALL documents to properly group into folders
  const fetchReadyDocuments = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors

      // Check if user and token are available
      const token = localStorage.getItem('token')
      if (!token || !user) {
        setLoading(false)
        return
      }

      // Fetch all documents by using a large pageSize (backend max is 50, so we'll fetch in chunks)
      let allDocuments: ReadyDocument[] = []
      let currentPage = 1
      const fetchPageSize = 50 // Backend max pageSize
      let hasMore = true

      while (hasMore) {
        const response = await fetch(`${API_URL}/documents/client/documents/ready?page=${currentPage}&pageSize=${fetchPageSize}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          // Handle authentication errors
          if (response.status === 401 || response.status === 403) {
            setError(null) // Don't show error for auth issues, let ProtectedRoute handle it
            setLoading(false)
            return
          }
          
          // Handle other errors
          const errorText = await response.text()
          console.error('Response error:', errorText)
          // Only set error for unexpected errors, not for empty results
          if (response.status !== 404) {
            setError('Error al cargar los documentos')
          } else {
            // 404 or empty results is normal for new users
            setError(null)
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        const documents = Array.isArray(data.items) ? data.items : []
        
        if (documents.length > 0) {
          allDocuments = [...allDocuments, ...documents]
        }

        // Check if there are more pages
        hasMore = data.hasNextPage || false
        currentPage++
        
        // Safety limit to prevent infinite loops
        if (currentPage > 1000) {
          console.warn('Reached maximum page limit')
          break
        }
      }

      setReadyDocs(allDocuments)

      // Group documents into folders by upload batch (no limit on documents per folder)
      const groupedFolders = groupDocumentsIntoFolders(allDocuments)
      
      // Preserve selected folder IDs for folders that still exist after re-grouping
      setSelectedFolderIds(prev => {
        const newFolderIds = new Set(groupedFolders.map(f => f.id))
        return prev.filter(id => newFolderIds.has(id))
      })
      
      setFolders(groupedFolders)

      // Preserve current page if it's still valid, otherwise reset to page 1
      const totalPages = Math.ceil(groupedFolders.length / folderPageSize)
      const preservedPage = pagination.page <= totalPages ? pagination.page : 1
      
      setPagination({
        page: preservedPage,
        pageSize: folderPageSize,
        totalCount: groupedFolders.length,
        totalPages: totalPages,
        hasNextPage: preservedPage < totalPages,
        hasPreviousPage: preservedPage > 1
      })
      
      // Clear any previous errors on success
      setError(null)
    } catch (error) {
      console.error('Error fetching ready documents:', error)
      // Only set error for actual errors, not for network issues that might be temporary
      if (error instanceof Error && !error.message.includes('fetch')) {
        setError('Error al cargar los documentos')
      } else {
        // Network or other issues - don't show error, just log
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch on mount - wait for user/auth to be ready
  useEffect(() => {
    if (user) {
      fetchReadyDocuments()
    }
  }, [user])

  // Fetch client's companies on mount
  useEffect(() => {
    if (user) {
      fetchMyCompanies()
    }
  }, [user])

  // Prevent body scroll when folder modal is open
  useEffect(() => {
    if (showFolderModal) {
      const scrollY = window.scrollY
      const body = window.document.body
      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'

      return () => {
        body.style.position = ''
        body.style.top = ''
        body.style.width = ''
        body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [showFolderModal])

  // Helper function to show feedback modal
  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setFeedbackModalContent({ type, title, message })
    setShowFeedbackModal(true)
  }

  // Handle folder selection
  const handleToggleFolderSelect = (folderId: string) => {
    setSelectedFolderIds(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  const handleSelectAllFolders = () => {
    if (selectedFolderIds.length === folders.length) {
      setSelectedFolderIds([])
    } else {
      setSelectedFolderIds(folders.map(folder => folder.id))
    }
  }

  const handleFolderClick = (folder: DocumentFolder) => {
    setSelectedFolder(folder)
    setFolderPage(1)
    // Do not open modal; render inline
    setShowFolderModal(false)
  }

  // removed unused handleCloseFolderModal

  const handleDocumentFromFolderClick = (docId: string) => {
    // Find the document from the selected folder and open preview modal
    if (selectedFolder) {
      const doc = selectedFolder.documents.find(d => d.id === docId)
      if (doc) {
        handlePreviewDocument(doc)
      }
    }
    setShowFolderModal(false) // Close folder modal when opening document
  }

  const handleSendSelectedFolders = async () => {
    if (selectedFolderIds.length === 0) return

    // Fetch client's companies
    try {
      const response = await fetch(`${API_URL}/companies/my-companies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch companies')
      
      const companyList = await response.json()
      setCompanies(companyList)
      
      if (companyList.length === 0) {
        showFeedback('error', 'Sin Empresas', 'No tienes empresas registradas. Por favor registra empresas primero.')
        return
      }
      
      // Show company selection modal
      setShowCompanyModal(true)
    } catch (error) {
      console.error('Error fetching companies:', error)
      showFeedback('error', t('common.error'), t('errors.somethingWentWrong'))
    }
  }

  // Calculate total size of documents to be sent
  const calculateTotalSize = () => {
    let totalSize = 0
    let docCount = 0
    selectedFolderIds.forEach(folderId => {
      const folder = folders.find(f => f.id === folderId)
      if (folder) {
        docCount += folder.documents.length
        // Estimate ~450KB per document (max is 500KB)
        totalSize += folder.documents.length * 5000 * 1024
      }
    })
    return { totalSize, docCount }
  }


  const performSendToCompany = async (companyIds: number[]) => {
    setSending(true)
    try {
      // Get all document IDs from selected folders
      const documentIds: number[] = []
      selectedFolderIds.forEach(folderId => {
        const folder = folders.find(f => f.id === folderId)
        if (folder) {
          folder.documents.forEach(doc => {
            documentIds.push(Number(doc.id))
          })
        }
      })

      if (documentIds.length === 0) {
        showFeedback('error', t('common.error'), t('documents.noDocuments'))
        setSending(false)
        return
      }

      console.log(`[SendToCompany] Sending ${documentIds.length} documents to ${companyIds.length} company(s)...`)

      // Send to each selected company
      let successCount = 0
      let failCount = 0

      for (const companyId of companyIds) {
        try {
          console.log(`[SendToCompany] Sending to company ${companyId}...`)
          
          // Add timeout to the fetch request
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 60000) // 1 minutes timeout

          const response = await fetch(`${API_URL}/documents/processed/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ documentIds, companyId: companyId.toString() }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
            console.error(`[SendToCompany] Failed for company ${companyId}:`, errorData.message)
            failCount++
            continue
          }

          await response.json() // Just to consume the response
          console.log(`[SendToCompany] ✅ Success for company ${companyId}`)
          successCount++
        } catch (err: any) {
          console.error(`[SendToCompany] Error for company ${companyId}:`, err.message)
          if (err.name === 'AbortError') {
            showFeedback('error', t('errors.somethingWentWrong'), t('errors.tryAgain'))
            setSending(false)
            return
          }
          failCount++
        }
      }
      
      if (successCount === 0) {
        showFeedback('error', t('errors.sendError'), t('errors.tryAgain'))
        setSending(false)
        return
      }

      const totalDocs = documentIds.length
      const companyNames = companyIds.map(id => companies.find(c => c.id === id)?.name || 'empresa').join(', ')
      
      const statusMessage = failCount > 0 
        ? `Se enviaron ${totalDocs} documento(s) a ${successCount}/${companyIds.length} empresa(s)`
        : `Se enviaron ${totalDocs} documento(s) de ${selectedFolderIds.length} carpeta(s) a ${companyNames} exitosamente`

      showFeedback(
        failCount > 0 ? 'info' : 'success',
        failCount > 0 ? t('documents.uploadFailed') : t('documents.uploadSuccess'),
        statusMessage
      )
      
      setSelectedFolderIds([]) // Clear selection after sending
      setShowCompanyModal(false)
      setSelectedCompanyIds([])
    } catch (error: any) {
      console.error('Error sending documents:', error)
      showFeedback('error', t('errors.sendError'), error.message || t('errors.tryAgain'))
    } finally {
      setSending(false)
    }
  }

  const toggleCompanySelection = (companyId: number) => {
    setSelectedCompanyIds(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const toggleNewCompanySelection = (companyId: number) => {
    setSelectedNewCompanyIds(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  // Fetch my companies
  const fetchMyCompanies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/companies/my-companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMyCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching my companies:', error)
    }
  }

  // Fetch available companies to add
  const fetchAvailableCompanies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/companies/approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter out companies already in myCompanies
        const myCompanyIds = myCompanies.map(c => c.id)
        const available = data.filter((c: any) => !myCompanyIds.includes(c.id))
        setAvailableCompanies(available)
      }
    } catch (error) {
      console.error('Error fetching available companies:', error)
    }
  }

  // Add companies to client
  const handleAddCompanies = async () => {
    if (selectedNewCompanyIds.length === 0) return

    try {
      const token = localStorage.getItem('token')
      const promises = selectedNewCompanyIds.map(companyId =>
        fetch(`${API_URL}/companies/my-companies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ companyId })
        })
      )
      
      await Promise.all(promises)
      
      showFeedback('success', t('common.success'), t('company.registrationSuccess'))
      setShowAddCompanyModal(false)
      setSelectedNewCompanyIds([])
      fetchMyCompanies() // Refresh list
    } catch (error) {
      console.error('Error adding companies:', error)
      showFeedback('error', t('common.error'), t('errors.createError'))
    }
  }

  // Show delete company confirmation
  const handleShowDeleteCompany = (company: { id: number; name: string }) => {
    setCompanyToDelete(company)
    setShowDeleteCompanyModal(true)
  }

  // Confirm and remove company from client
  const handleConfirmRemoveCompany = async () => {
    if (!companyToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/companies/my-companies/${companyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        showFeedback('success', 'Empresa Eliminada', 'Empresa eliminada de tu lista')
        fetchMyCompanies() // Refresh list
        setShowDeleteCompanyModal(false)
        setCompanyToDelete(null)
      }
    } catch (error) {
      console.error('Error removing company:', error)
      showFeedback('error', t('common.error'), t('errors.deleteError'))
    }
  }

  // removed unused sanitizeFileName helper

  const triggerDownload = async (fileName: string, blob: Blob) => {
    // Validate blob type and size
    if (!blob || blob.size === 0) {
      throw new Error('Empty file received')
    }
    // If server returned JSON (likely error text), try to parse to show meaningful error
    if (blob.type && blob.type.includes('application/json')) {
      try {
        const text = await blob.text()
        throw new Error(text || 'Invalid file content')
      } catch (e: any) {
        throw new Error(typeof e?.message === 'string' ? e.message : 'Invalid file content')
      }
    }

    const url = window.URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    window.document.body.appendChild(link)
    // Give the browser a moment before clicking programmatically
    setTimeout(() => {
      try { link.click() } finally {
        window.document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    }, 0)
  }

  const handleDownloadSelectedFolders = async () => {
    // If user is inside a folder view and no folders are selected, download current folder
    if (selectedFolder && selectedFolderIds.length === 0) {
      setDownloading(true)
      try {
        const documentIds = selectedFolder.documents.map(d => Number(d.id))
        if (documentIds.length === 0) {
          showFeedback('info', 'Sin documentos', 'La carpeta actual no contiene documentos para descargar.')
          return
        }
        
        // Create ZIP with folder structure
        const zip = new JSZip()
        const folderName = selectedFolder.folderName.replace(/\//g, '-').replace(/\s/g, '_')
        const usedNames = new Set<string>()
        
        // Download each document and add to folder in ZIP
        for (const docId of documentIds) {
          try {
            // Use fetch to get both blob and headers
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/documents/client/documents/${docId}/file`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const blob = await response.blob()
            
            // Extract filename from Content-Disposition header
            let fileName: string | undefined
            const contentDisposition = response.headers.get('content-disposition')
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
              if (filenameMatch && filenameMatch[1]) {
                fileName = filenameMatch[1].replace(/['"]/g, '')
              }
            }
            
            if (!fileName) {
              const meta = readyDocs.find(d => d.id === String(docId))
              const rfcPrefix = meta?.rfcEmisor ? meta.rfcEmisor.slice(0, 4).toUpperCase() : 'XXXX'
              fileName = `${rfcPrefix}_document.pdf`
            }
            // Ensure unique name inside this folder
            const uniqueName = ensureUniqueFileName(fileName, usedNames)
            zip.file(`${folderName}/${uniqueName}`, blob)
          } catch (error) {
            console.error(`Error downloading document ${docId}:`, error)
          }
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const ts = new Date()
        const dateStr = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`
        await triggerDownload(`carpeta_${dateStr}.zip`, zipBlob)
        showFeedback('success', t('common.success'), `${t('documents.download')}: ${documentIds.length} ${t('documents.fileName')}(s)`)
      } catch (error) {
        console.error('Error downloading folder:', error)
        showFeedback('error', t('common.error'), t('errors.somethingWentWrong'))
      } finally {
        setDownloading(false)
      }
      return
    }

    if (selectedFolderIds.length === 0) return
    setDownloading(true)
    try {
      // Create ZIP with separate folders for each selected folder
      const zip = new JSZip()
      let totalDocs = 0
      
      // Process each selected folder
      for (const folderId of selectedFolderIds) {
        const folder = folders.find(f => f.id === folderId)
        if (!folder || folder.documents.length === 0) continue
        
        // Sanitize folder name for file system
        const folderName = folder.folderName.replace(/\//g, '-').replace(/\s/g, '_')
        const usedNames = new Set<string>()
        
        // Download each document in this folder and add to ZIP
        for (const doc of folder.documents) {
          try {
            const docId = Number(doc.id)
            // Use fetch to get both blob and headers
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/documents/client/documents/${docId}/file`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const blob = await response.blob()
            
            // Extract filename from Content-Disposition header
            let fileName: string | undefined
            const contentDisposition = response.headers.get('content-disposition')
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
              if (filenameMatch && filenameMatch[1]) {
                fileName = filenameMatch[1].replace(/['"]/g, '')
              }
            }
            
            if (!fileName) {
              const meta = readyDocs.find(d => d.id === String(docId))
              const rfcPrefix = meta?.rfcEmisor ? meta.rfcEmisor.slice(0, 4).toUpperCase() : 'XXXX'
              fileName = `${rfcPrefix}_document.pdf`
            }
            // Ensure unique name inside this folder
            const uniqueName = ensureUniqueFileName(fileName, usedNames)
            zip.file(`${folderName}/${uniqueName}`, blob)
            totalDocs++
          } catch (error) {
            console.error(`Error downloading document ${doc.id}:`, error)
          }
        }
      }
      
      if (totalDocs === 0) {
        showFeedback('info', 'Sin documentos', 'Las carpetas seleccionadas no contienen documentos para descargar.')
        return
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const ts = new Date()
      const dateStr = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`
      await triggerDownload(`carpetas_${dateStr}.zip`, zipBlob)
      showFeedback('success', t('common.success'), `${t('documents.download')}: ${totalDocs} ${t('documents.fileName')}(s)`)
    } catch (error) {
      console.error('Merged batch download failed:', error)
      showFeedback('error', t('common.error'), t('errors.somethingWentWrong'))
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteSelectedFolders = async () => {
    if (selectedFolderIds.length === 0) return
    // Open confirmation modal instead of deleting immediately
    setPendingDeleteFolderIds([...selectedFolderIds])
    setShowDeleteConfirm(true)
  }

  const confirmDeleteFolders = async () => {
    if (pendingDeleteFolderIds.length === 0) {
      setShowDeleteConfirm(false)
      return
    }
    setDeleting(true)
    try {
      // collect processed document ids from the folders to delete
      const documentIds: number[] = []
      pendingDeleteFolderIds.forEach(folderId => {
        const folder = folders.find(f => f.id === folderId)
        if (!folder) return
        folder.documents.forEach(doc => documentIds.push(Number(doc.id)))
      })
      if (documentIds.length > 0) {
        await documentApi.deleteBatch(documentIds)
      }
      const remaining = folders.filter(f => !pendingDeleteFolderIds.includes(f.id))
      setFolders(remaining)
      // also remove from readyDocs so counts and other UI match
      setReadyDocs(prev => prev.filter(doc => !documentIds.includes(Number(doc.id))))
      setSelectedFolderIds([])
      setPendingDeleteFolderIds([])
      setShowDeleteConfirm(false)
      showFeedback('success', t('common.success'), t('documents.uploadSuccess'))
    } catch (error: any) {
      console.error('Error deleting documents:', error)
      const message = error?.response?.data || 'No se pudieron eliminar las carpetas seleccionadas.'
      showFeedback('error', t('common.error'), typeof message === 'string' ? message : t('errors.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const cancelDeleteFolders = () => {
    setShowDeleteConfirm(false)
    setPendingDeleteFolderIds([])
  }

  // Upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const maxSizeBytes = 5000 * 1024 // 500KB
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf')
      
      // Validate file sizes
      const oversizedFiles = pdfFiles.filter(file => file.size > maxSizeBytes)
      const validFiles = pdfFiles.filter(file => file.size <= maxSizeBytes)
      
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.map(f => {
          const sizeKB = Math.round(f.size / 1024)
          return `${f.name} (${sizeKB}KB)`
        }).join(', ')
        
        showFeedback('error', t('common.error'), t('documents.uploadFailed'))
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles])
      } else if (pdfFiles.length === 0) {
        showFeedback('error', t('common.error'), t('documents.uploadFailed'))
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const maxSizeBytes = 5000 * 1024 // 500KB
      const pdfFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf')
      
      // Validate file sizes
      const oversizedFiles = pdfFiles.filter(file => file.size > maxSizeBytes)
      const validFiles = pdfFiles.filter(file => file.size <= maxSizeBytes)
      
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.map(f => {
          const sizeKB = Math.round(f.size / 1024)
          return `${f.name} (${sizeKB}KB)`
        }).join(', ')
        
        showFeedback('error', t('common.error'), t('documents.uploadFailed'))
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles])
      } else if (pdfFiles.length === 0) {
        showFeedback('error', t('common.error'), t('documents.uploadFailed'))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    const uploaded: string[] = []
    const failed: string[] = []

    try {
      // Create a stable batch id for this submit click
      const userIdPart = (user as any)?.id ?? 'u'
      const batchId = `BATCH-${userIdPart}-${Date.now()}`

      // Upload files sequentially
      for (const file of selectedFiles) {
        try {
          await documentApi.upload(file, 1, batchId)
          uploaded.push(file.name)
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error)
          failed.push(file.name)
        }
      }

      // Clear selected files
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Wait a moment for processing, then refresh
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds for processing
      await fetchReadyDocuments() // Refresh the documents list

      // Show success message with uploaded file names
      if (uploaded.length > 0) {
        setUploadedFileNames(uploaded)
        setShowSuccessModal(true)
      }

      // Show error for failed uploads if any
      if (failed.length > 0) {
        showFeedback('error', 'Error de Subida', `Error al subir ${failed.length} archivo(s): ${failed.join(', ')}`)
      }
    } catch (error) {
      console.error('Upload process failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showFeedback('error', 'Error de Subida', `Error al subir los documentos: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  // Show loading while waiting for user/auth or while fetching
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton variant="text" width="60%" height={32} className="mx-auto" />
          <Skeleton variant="rectangular" height={200} />
          <Skeleton count={3} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">{t('errors.uploadError')}</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col client-text-black">
      {/* Advanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

        {/* Animated Lines */}
      </div>

      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-[#64c7cd] backdrop-blur-xl border-b border-white/20 relative z-10">
        <div className="w-full flex justify-center sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between w-[90%] sm:w-[70%]">
            {/* Left Side - Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="relative p-2 rounded-xl">
                  <img src="/logo.png" alt="CAAST" className="h-8 sm:h-10" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {t('client.dashboard')}
                </h1>
              </div>
            </div>

            {/* Right Side - Status & Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#eb3089]/10 hover:border-[#eb3089]/30 border border-transparent transition-all duration-300 group"
              >
                <div className="p-2 rounded-lg bg-rose-500 group-hover:bg-rose-600">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium !text-rose-500 hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full py-6 sm:py-10 flex-1 flex flex-row lg:flex-row gap-3 sm:gap-6 justify-center">
        <div className='flex w-[90%] sm:w-[70%]'>
          {/* Left Column - Upload Section + Stats */}
          <div className="w-full gap-3 sm:gap-4">
            <div className='w-full flex flex-col lg:flex-row sm:flex-col'>
              {/* Modern Upload Section */}
              <div className="w-full bg-white rounded-2xl shadow-xl hover:shadow-2xl border border-[#64c7cd]/30 p-2 sm:p-3 mb-3 sm:mb-6 relative overflow-auto group transition-all duration-500">
                {/* Glassmorphism Effect */}

                <div className="relative z-10 flex items-center justify-between flex-col">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="p-3 bg-[#a5cc55] rounded-2xl shadow-2xl">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold ">{t('documents.uploadTitle')}</h2>
                      <p className="text-sm">{t('documents.dragAndDrop')}</p>
                    </div>
                  </div>

                  {/* Modern Drag and Drop Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all duration-500 w-full sm:w-80 group/drop ${dragActive
                      ? 'border-[#64c7cd] bg-[#64c7cd]/10'
                      : 'border-[#64c7cd]/30 hover:border-[#64c7cd] hover:bg-[#64c7cd]/5'
                      }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                    />
                    <div className="space-y-3 sm:space-y-4 relative z-10">
                      <div className="relative mx-auto w-8 h-8 sm:w-10 sm:h-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (fileInputRef.current) {
                              fileInputRef.current.click()
                            }
                          }}
                          className="relative w-full h-full bg-[#64c7cd] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-500 cursor-pointer z-20"
                        >
                          <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-black mb-1">
                          {selectedFiles.length > 0
                            ? `${selectedFiles.length} ${t('client.filesSelected')}`
                            : t('client.dragAndDrop')}
                        </p>
                        <p className="text-xs text-black/70">
                          {selectedFiles.length > 0
                            ? t('documents.uploadButton')
                            : t('documents.dragAndDrop')}
                        </p>
                        <p className="text-xs text-red-500 font-medium mt-1">
                          {t('client.maxFileSize')}: 5MB
                        </p>
                      </div>
                      {selectedFiles.length > 0 && (
                        <div className="w-full max-h-32 overflow-y-auto space-y-2 mt-2 relative z-10">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="inline-flex items-center justify-between px-3 py-1.5 bg-[#a5cc55]/10 border border-[#a5cc55]/40 rounded-full w-full">
                              <div className="flex items-center flex-1 min-w-0">
                                <p className="text-xs text-black font-medium truncate">{file.name}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                className="ml-2 text-black hover:text-red-600 transition-colors flex-shrink-0 relative z-20"
                                type="button"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modern Upload Button */}
                  <button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || uploading}
                    className={`relative px-6 mt-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 w-full sm:w-auto overflow-hidden group/btn ${selectedFiles.length > 0 && !uploading
                      ? 'bg-[#eb3089] text-white shadow-2xl hover:shadow-lg hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <Skeleton variant="circular" width={20} height={20} />
                        <span className="font-semibold">{t('documents.processing')} {selectedFiles.length}...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="font-semibold">
                          {selectedFiles.length > 0
                            ? `${t('common.upload')} ${selectedFiles.length}`
                            : t('common.upload')
                          }
                        </span>
                      </div>
                    )}

                    {/* Button Shine Effect */}
                    {selectedFiles.length > 0 && !uploading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Modern Stats Cards */}
              <div className="w-full lg:ml-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-6">
                {/* Documents Processed */}
                <div className="bg-white rounded-2xl shadow-xl border border-[#64c7cd]/40 p-2 sm:p-3 hover:shadow-2xl hover:scale-[101%] transition-all duration-500 group relative overflow-hidden">

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="p-3 bg-[#64c7cd] rounded-2xl shadow-2xl">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-black/70 uppercase tracking-wider">{t('dashboard.processedDocuments')}</p>
                          <p className="text-xl sm:text-2xl font-bold text-black">{readyDocs.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sent Documents */}
                <div className="bg-white rounded-2xl shadow-xl border border-[#64c7cd]/40 p-2 sm:p-3 hover:shadow-2xl hover:scale-[101%] transition-all duration-500 group relative overflow-hidden">

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="p-3 bg-[#a15ade] rounded-2xl shadow-2xl">
                            <Send className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-black/70 uppercase tracking-wider">{t('client.sent')}</p>
                          <p className="text-xl sm:text-2xl font-bold text-black">
                            {readyDocs.filter(doc => doc.isSentToAdmin || doc.isSentToCompany).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Non-Compliant */}
                <div className="bg-white rounded-2xl shadow-xl border border-[#64c7cd]/40 p-2 sm:p-3 hover:shadow-2xl hover:scale-[101%] transition-all duration-500 group relative overflow-hidden">

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="p-3 bg-[#eb3089] rounded-2xl shadow-2xl">
                            <XCircle className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-black/70 uppercase tracking-wider">{t('dashboard.pendingDocuments')}</p>
                          <p className="text-xl sm:text-2xl font-bold text-black">
                            {readyDocs.filter(doc => doc.complianceStatus === 'NON_COMPLIANT').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* My Companies */}
                <div 
                  onClick={() => {
                    fetchMyCompanies()
                    setShowManageCompaniesModal(true)
                  }}
                  className="bg-white rounded-2xl shadow-xl border border-[#eb3089]/40 p-2 sm:p-3 hover:shadow-2xl hover:scale-[101%] transition-all duration-500 group relative overflow-hidden cursor-pointer"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="p-3 bg-[#eb3089] rounded-2xl shadow-2xl">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-black/70 uppercase tracking-wider">{t('client.myCompanies')}</p>
                          <p className="text-xl sm:text-2xl font-bold text-black">{myCompanies.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Document List */}
            <div className="flex flex-col mb-5">
              {/* Modern Document List */}
              <div className="flex bg-white rounded-2xl shadow-xl border border-[#64c7cd]/40 overflow-hidden flex flex-col relative group">

                {/* Modern Header */}
                <div className="relative z-10 px-2 sm:px-3 py-2 sm:py-3 border-b border-[#64c7cd]/40 bg-[#64c7cd]">
                  <div className="flex items-center justify-start">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="p-3 bg-[#eb3089] rounded-2xl shadow-2xl">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-white sm:text-xl font-bold">
                          {t('client.readyDocuments')} ({folders.length})
                        </h2>
                        <p className="text-xs text-white">{t('common.status')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modern Re-processing Notice */}
                  {readyDocs.some(doc =>
                    getDisplayValue(doc.rfcEmisor, "RFC") === "Re-procesar" ||
                    getDisplayValue(doc.periodo, "PERIODO") === "Re-procesar" ||
                    getDisplayValue(doc.montoTotalMxn, "MONTO") === "Re-procesar"
                  ) && (
                      <div className="relative z-10 bg-[#eb3089]/10 border border-[#eb3089]/40 rounded-xl p-2 sm:p-3 mt-2 sm:mt-3">
                        <div className="flex items-center">
                          <div className="relative mr-2 sm:mr-3">
                            <div className="h-4 w-4 sm:h-5 sm:w-5 bg-[#eb3089] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-black font-medium">
                            Algunos documentos necesitan re-procesamiento
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Bulk Actions */}
                  {selectedFolderIds.length > 0 && (
                    <div className="relative z-10 bg-[#64c7cd]/10 border border-[#64c7cd]/40 rounded-xl p-2 sm:p-3 mt-2 sm:mt-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center">
                          <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#64c7cd] mr-2" />
                          <p className="text-xs sm:text-sm text-black font-medium">
                            {selectedFolderIds.length} {t('client.foldersSelected')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleDownloadSelectedFolders}
                            disabled={downloading}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#a5cc55] border border-transparent rounded-lg hover:bg-[#a5cc55]/80 disabled:opacity-50 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            {downloading ? (
                              <>
                                <Skeleton variant="circular" width={12} height={12} />
                                <span>Descargando...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                <span>{t('client.downloadAll')}</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleDeleteSelectedFolders}
                            disabled={deleting}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#eb3089] border border-transparent rounded-lg hover:bg-[#eb3089]/80 disabled:opacity-50 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            {deleting ? (
                              <>
                                <Skeleton variant="circular" width={12} height={12} />
                                <span>Eliminando...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3" />
                                <span>{t('client.deleteButton')}</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleSendSelectedFolders}
                            disabled={sending}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-[#a15ade] border border-transparent rounded-lg hover:bg-[#a15ade]/80 disabled:opacity-50 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            {sending ? (
                              <>
                                <Skeleton variant="circular" width={12} height={12} />
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3" />
                                <span>{t('client.sendButton')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modern Folder Grid */}
                <div className="relative z-10 w-full">
                  {selectedFolder ? (
                    <div className="p-4 sm:p-6">
                      {/* Inline folder header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedFolder(null)
                              setFolderPage(1)
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-lg hover:bg-[#64c7cd]/80 hover:shadow-lg transition-all duration-300 flex items-center space-x-1"
                          >
                            <ChevronLeft className="h-3 w-3" />
                            <span>{t('client.backButton')}</span>
                          </button>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-black">{selectedFolder.folderName}</h3>
                            <p className="text-xs text-black/70">{selectedFolder.documentCount} {selectedFolder.documentCount === 1 ? 'documento' : 'documentos'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Documents list */}
                      <div className="space-y-2 mb-4">
                        {selectedFolder.documents
                          .slice((folderPage - 1) * folderPageSize, folderPage * folderPageSize)
                          .map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => handleDocumentFromFolderClick(doc.id)}
                              className="flex items-center space-x-4 p-3 bg-white border border-[#64c7cd]/30 hover:border-[#64c7cd] hover:shadow-lg rounded-lg cursor-pointer transition-all duration-200 group"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-[#64c7cd] rounded flex items-center justify-center shadow-lg">
                                  <FileText className="h-6 w-6 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate group-hover:text-[#64c7cd]">
                                  {doc.proveedorEmail || `Documento ${doc.id}`}
                                </p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-black/60">RFC:</span>
                                    <span className="text-xs text-black/80 font-mono">{getDisplayValue(doc.rfcEmisor, 'RFC')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePreviewDocument(doc) }}
                                  className="p-2 text-[#64c7cd] hover:text-[#64c7cd]/80 hover:bg-[#64c7cd]/10 rounded-lg transition-all duration-200"
                                  title="Vista previa del PDF"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async (e) => { e.stopPropagation(); await handleDownload(doc.id) }}
                                  className="p-2 text-[#a5cc55] hover:text-[#a5cc55]/80 hover:bg-[#a5cc55]/10 rounded-lg transition-all duration-200"
                                  title="Descargar documento"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Pagination */}
                      {Math.ceil(selectedFolder.documents.length / folderPageSize) > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-black/70">Página {folderPage} de {Math.ceil(selectedFolder.documents.length / folderPageSize)}</span>
                            <span className="text-xs text-black/50">({selectedFolder.documents.length} documento{selectedFolder.documents.length !== 1 ? 's' : ''} total)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setFolderPage(prev => Math.max(1, prev - 1))}
                              disabled={folderPage === 1}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-lg hover:bg-[#64c7cd]/80 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                            >
                              <ChevronLeft className="h-3 w-3" /> <span>{t('common.back')}</span>
                            </button>
                            <button
                              onClick={() => setFolderPage(prev => Math.min(Math.ceil(selectedFolder.documents.length / folderPageSize), prev + 1))}
                              disabled={folderPage >= Math.ceil(selectedFolder.documents.length / folderPageSize)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-lg hover:bg-[#64c7cd]/80 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                            >
                              <span>{t('common.next')}</span> <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      {/* Select All Header */}
                      {folders.length > 0 && (
                        <div className="flex items-center justify-end mb-4">
                          <button
                            onClick={handleSelectAllFolders}
                            className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-black bg-white border border-[#64c7cd]/40 rounded-lg hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
                          >
                            <CheckSquare
                              className={`h-4 w-4 transition-colors ${selectedFolderIds.length === folders.length && folders.length > 0
                                  ? 'text-[#eb3089] fill-current'
                                  : 'text-black/40'
                                }`}
                            />
                            <span>{t('client.selectAll')}</span>
                          </button>
                        </div>
                      )}

                      {/* Folder Grid */}
                      {folders.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="h-16 w-16 text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-black mb-1">{t('documents.noDocuments')}</p>
                            <p className="text-sm text-black/60">{t('client.noDocuments')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                          {folders
                            .slice((pagination.page - 1) * folderPageSize, pagination.page * folderPageSize)
                            .map((folder) => (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              onFolderClick={handleFolderClick}
                              onSelect={handleToggleFolderSelect}
                              isSelected={selectedFolderIds.includes(folder.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pagination Controls - For Folders */}
                  {Math.ceil(folders.length / folderPageSize) > 1 && (
                    <div className="relative z-10 px-3 sm:px-6 py-3 sm:py-4 border-t border-[#64c7cd]/40 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-black/70">
                            Página {pagination.page} de {Math.ceil(folders.length / folderPageSize)}
                          </span>
                          <span className="text-xs text-black/50">
                            ({Math.min(folderPageSize, folders.length - (pagination.page - 1) * folderPageSize)} de {folders.length} carpeta{folders.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-lg hover:bg-[#64c7cd]/80 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                          >
                            <ChevronLeft className="h-3 w-3" /> <span>Anterior</span>
                          </button>
                          <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(Math.ceil(folders.length / folderPageSize), prev.page + 1) }))}
                            disabled={pagination.page >= Math.ceil(folders.length / folderPageSize)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-lg hover:bg-[#64c7cd]/80 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                          >
                            <span>Siguiente</span> <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Success Modal */}
        {showSuccessModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-1000 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSuccessModal(false)
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md sm:max-w-lg p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto transition-all duration-1000 animate-in zoom-in-95 slide-in-from-bottom-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </button>

              <div className="mb-4 sm:mb-6 pr-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#a5cc55] rounded-xl">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">
                    {t('documents.uploadSuccess')}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-black">
                  {uploadedFileNames.length} archivo{uploadedFileNames.length > 1 ? 's' : ''} procesado{uploadedFileNames.length > 1 ? 's' : ''} correctamente
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3 sm:space-y-4">
                  {uploadedFileNames.map((fileName, index) => (
                    <div key={index} className="p-4 bg-[#a5cc55]/10 border border-[#a5cc55]/40 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#a5cc55] rounded-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">{fileName}</p>
                          <p className="text-xs text-black">{t('documents.completed')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-black mb-1">{t('documents.status')}</p>
                      <p className="text-lg font-semibold text-black">{readyDocs.length}</p>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Database className="h-5 w-5 text-black" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2 text-xs text-black">
                    <CheckSquare className="h-3 w-3 text-black" />
                    <span>{t('client.readyToSend')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-4 sm:mt-6">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full sm:w-auto bg-[#eb3089] px-4 sm:px-6 py-2 text-sm font-medium text-white border border-[#eb3089]/40 rounded-xl hover:bg-[#eb3089]/80 transition-all duration-300 hover:scale-105 shadow-md"
                >
                  {t('company.continue')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && feedbackModalContent && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFeedbackModal(false)
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md sm:max-w-lg p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </button>

              <div className="mb-4 sm:mb-6 pr-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-xl ${feedbackModalContent.type === 'success' ? 'bg-[#a5cc55]' : feedbackModalContent.type === 'error' ? 'bg-[#eb3089]' : 'bg-[#64c7cd]'}`}>
                    {feedbackModalContent.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    ) : feedbackModalContent.type === 'error' ? (
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    ) : (
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">{feedbackModalContent.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-black">{feedbackModalContent.message}</p>
              </div>

              <div className="flex items-center justify-end mt-4 sm:mt-6">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-white bg-[#64c7cd] border border-[#64c7cd]/40 rounded-xl hover:bg-[#64c7cd]/80 hover:shadow-lg transition-all duration-300"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Selection Modal */}
        {showCompanyModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCompanyModal(false)
                setSelectedCompanyIds([])
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-md sm:max-w-lg p-4 sm:p-6 relative">
              <button
                onClick={() => {
                  setShowCompanyModal(false)
                  setSelectedCompanyIds([])
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </button>

              <div className="mb-4 sm:mb-6 pr-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#eb3089] rounded-xl">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">{t('company.selectCompanies')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-black/60">{t('company.selectCompaniesSubtitle')}</p>
                {selectedCompanyIds.length > 0 && (
                  <p className="text-xs sm:text-sm text-[#eb3089] font-medium mt-2">
                    {selectedCompanyIds.length} empresa(s) seleccionada(s)
                  </p>
                )}
              </div>

              {/* Document Info */}
              <div className="mb-4 p-3 bg-[#64c7cd]/10 rounded-xl border border-[#64c7cd]/30">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-black/60 text-xs mb-1">{t('documents.selectedFiles')}</p>
                    <p className="text-black font-semibold">{calculateTotalSize().docCount} PDFs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-black/60 text-xs mb-1">{t('common.total')}</p>
                    <p className="text-black font-semibold">~{Math.round(calculateTotalSize().totalSize / 1024)}KB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => toggleCompanySelection(company.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedCompanyIds.includes(company.id)
                        ? 'border-[#eb3089] bg-[#eb3089]/10'
                        : 'border-gray-200 hover:border-[#eb3089]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedCompanyIds.includes(company.id) ? 'bg-[#eb3089]' : 'bg-gray-300'
                        }`}>
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{company.name}</p>
                          <p className="text-xs text-black/60">RFC: {company.rfc}</p>
                          <p className="text-xs text-black/60">{company.email}</p>
                        </div>
                      </div>
                      {selectedCompanyIds.includes(company.id) && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-[#eb3089]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    setShowCompanyModal(false)
                    setSelectedCompanyIds([])
                  }}
                  disabled={sending}
                  className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-sm disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => selectedCompanyIds.length > 0 && performSendToCompany(selectedCompanyIds)}
                  disabled={selectedCompanyIds.length === 0 || sending}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-xl transition-all duration-300 shadow-lg ${
                    selectedCompanyIds.length === 0 || sending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#eb3089] hover:bg-[#eb3089]/80 hover:scale-105'
                  }`}
                >
                  {sending ? t('documents.uploading') : t('documents.send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !deleting) cancelDeleteFolders() }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md sm:max-w-lg p-4 sm:p-6 relative">
              <button
                onClick={cancelDeleteFolders}
                disabled={deleting}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
              </button>
              <div className="mb-4 sm:mb-6 pr-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#eb3089]">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">{t('common.confirm')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-black">
                  {t('company.confirmDelete')}
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={cancelDeleteFolders}
                  disabled={deleting}
                  className="px-4 sm:px-6 py-2 text-sm font-medium text-black bg-white border border-[#64c7cd]/40 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDeleteFolders}
                  disabled={deleting}
                  className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-[#eb3089] border border-[#eb3089]/40 rounded-xl hover:bg-[#eb3089]/80 hover:shadow-lg transition-all duration-300"
                >
                  {deleting ? t('documents.uploading') : t('common.yes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfModal && previewDocument && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl)
                  setPdfUrl(null)
                }
                setShowPdfModal(false)
                setPreviewDocument(null)
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-6xl max-h-[75vh] mt-16 p-4 sm:p-6 relative flex flex-col overflow-hidden">
              <button
                onClick={() => {
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl)
                    setPdfUrl(null)
                  }
                  setShowPdfModal(false)
                  setPreviewDocument(null)
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 z-10"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black hover:text-black" />
              </button>

              {/* Header */}
              <div className="mb-4 sm:mb-6 pr-8">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#64c7cd] rounded-xl">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-black">{t('documents.preview')}</h3>
                    <p className="text-xs sm:text-sm text-black">
                      RFC: {previewDocument.rfcEmisor}
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
                      <p className="text-black">{t('common.loading')}</p>
                    </div>
                  </div>
                ) : pdfError ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <p className="text-black mb-2">{pdfError}</p>
                      <button
                        onClick={() => previewDocument && handlePreviewDocument(previewDocument)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#64c7cd] rounded-xl hover:bg-[#64c7cd]/80 transition-all duration-300"
                      >
                        {t('common.refresh')}
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
                      <p className="text-black mb-2">{t('errors.somethingWentWrong')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manage Companies Modal */}
        {showManageCompaniesModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowManageCompaniesModal(false)
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#eb3089]/30 w-full max-w-3xl p-6 relative max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setShowManageCompaniesModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-5 w-5 text-black" />
              </button>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#eb3089] rounded-xl">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black">{t('client.myCompanies')}</h3>
                </div>
                <p className="text-sm text-black/60">
                  {t('company.selectCompaniesSubtitle')}
                </p>
              </div>

              {/* Add Company Button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    fetchAvailableCompanies()
                    setShowAddCompanyModal(true)
                  }}
                  className="px-4 py-2 bg-[#eb3089] text-white rounded-xl hover:bg-[#eb3089]/80 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <Building className="h-4 w-4" />
                  <span>{t('client.addCompany')}</span>
                </button>
              </div>

              {/* Companies List */}
              {myCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-black/60 mb-1">{t('client.noCompanies')}</p>
                  <p className="text-xs text-black/40">{t('client.addCompany')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#eb3089]/50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#eb3089] flex items-center justify-center">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-black">{company.name}</p>
                            <p className="text-xs text-black/60">RFC: {company.rfc}</p>
                            <p className="text-xs text-black/60">{company.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleShowDeleteCompany({ id: company.id, name: company.name })}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Eliminar empresa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowManageCompaniesModal(false)}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#64c7cd] rounded-xl hover:bg-[#64c7cd]/80 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Company Modal */}
        {showAddCompanyModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddCompanyModal(false)
                setSelectedNewCompanyIds([])
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#64c7cd]/30 w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowAddCompanyModal(false)
                  setSelectedNewCompanyIds([])
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <XCircle className="h-5 w-5 text-black" />
              </button>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#eb3089] rounded-xl">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black">{t('client.addCompany')}</h3>
                </div>
                <p className="text-sm text-black/60">
                  {t('company.selectCompaniesSubtitle')}
                </p>
                {selectedNewCompanyIds.length > 0 && (
                  <p className="text-sm text-[#eb3089] font-medium mt-2">
                    {selectedNewCompanyIds.length} empresa(s) seleccionada(s)
                  </p>
                )}
              </div>

              {availableCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-black/60">{t('company.noCompaniesFound')}</p>
                  <p className="text-xs text-black/40 mt-1">{t('common.none')}</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {availableCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => toggleNewCompanySelection(company.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedNewCompanyIds.includes(company.id)
                          ? 'border-[#eb3089] bg-[#eb3089]/10'
                          : 'border-gray-200 hover:border-[#eb3089]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedNewCompanyIds.includes(company.id) ? 'bg-[#eb3089]' : 'bg-gray-300'
                          }`}>
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-black">{company.name}</p>
                            <p className="text-xs text-black/60">RFC: {company.rfc}</p>
                            <p className="text-xs text-black/60">{company.email}</p>
                          </div>
                        </div>
                        {selectedNewCompanyIds.includes(company.id) && (
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-[#eb3089]" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowAddCompanyModal(false)
                    setSelectedNewCompanyIds([])
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddCompanies}
                  disabled={selectedNewCompanyIds.length === 0}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-xl transition-all duration-300 ${
                    selectedNewCompanyIds.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#eb3089] hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {t('client.addCompany')} {selectedNewCompanyIds.length > 0 && `(${selectedNewCompanyIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Company Confirmation Modal */}
        {showDeleteCompanyModal && companyToDelete && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteCompanyModal(false)
                setCompanyToDelete(null)
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-red-300 w-full max-w-md p-6 relative">
              <button
                onClick={() => {
                  setShowDeleteCompanyModal(false)
                  setCompanyToDelete(null)
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
                  <h3 className="text-xl font-bold text-black">Confirmar Eliminación</h3>
                </div>
                
                <p className="text-sm text-black/70 mb-2">
                  ¿Estás seguro de que deseas eliminar esta empresa de tu lista?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                  <p className="font-semibold text-black mb-1">{companyToDelete.name}</p>
                  <p className="text-xs text-black/60">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteCompanyModal(false)
                    setCompanyToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRemoveCompany}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}