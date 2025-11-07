import { useState, useCallback } from 'react'
import { FileItem } from '../types/api'

interface UseSupplierFilesReturn {
  files: FileItem[]
  loading: boolean
  error: string | null
  refreshFiles: () => Promise<void>
}

/**
 * Hook for managing supplier files
 * Handles fetching file list and provides refresh functionality
 */
export function useSupplierFiles(): UseSupplierFilesReturn {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Mock data - no backend required
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock file list with sample data for demo
      const mockFiles: FileItem[] = [
        {
          id: 'demo-file-1',
          fileName: 'invoice_2024_01.pdf',
          uploadDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'Success',
          fileSize: 1280000,
          createdAtUtc: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          convertedAvailable: true,
          convertedSizeKB: 1250,
          failureReason: null
        },
        {
          id: 'demo-file-2',
          fileName: 'contract_draft.pdf',
          uploadDate: new Date(Date.now() - 3600000).toISOString(),
          status: 'Pending',
          fileSize: 2560000,
          createdAtUtc: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          convertedAvailable: false,
          convertedSizeKB: 0,
          failureReason: null
        },
        {
          id: 'demo-file-3',
          fileName: 'large_document.pdf',
          uploadDate: new Date(Date.now() - 7200000).toISOString(),
          status: 'Failed',
          fileSize: 5120000,
          createdAtUtc: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          convertedAvailable: false,
          convertedSizeKB: 0,
          failureReason: 'File too large. Please compress and try again.'
        }
      ]
      setFiles(mockFiles)
    } catch (err) {
      console.error('Error fetching files:', err)
      setError('Failed to load files. Please try again.')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    files,
    loading,
    error,
    refreshFiles
  }
}
