import { useState } from 'react'
import { FileItem } from '../types/api'
import { StatusBadge } from './StatusBadge'
import { formatDateLocal } from '../utils/dateUtils'
import { downloadBlob } from '../utils/fileUtils'

interface FileTableProps {
  files: FileItem[]
  loading: boolean
}

/**
 * File table component for displaying supplier files
 * Shows file list with status, size, and download actions
 */
export function FileTable({ files, loading }: FileTableProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  const handleDownload = async (fileId: string) => {
    setDownloadingIds(prev => new Set(prev).add(fileId))
    
    try {
      // Mock download - no backend required
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create a mock PDF blob for demo
      const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Demo PDF - ${fileId}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`
      
      const blob = new Blob([mockPdfContent], { type: 'application/pdf' })
      downloadBlob(blob, `${fileId}.pdf`)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file. Please try again.')
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const getActionButton = (file: FileItem) => {
    const isDownloading = downloadingIds.has(file.id)
    
    switch (file.status) {
      case 'Success':
        return (
          <button
            onClick={() => handleDownload(file.id)}
            disabled={isDownloading}
            className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        )
      case 'Pending':
        return (
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-xs font-medium cursor-not-allowed"
          >
            Processing
          </button>
        )
      case 'Failed':
        return (
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-xs font-medium cursor-not-allowed"
          >
            Unavailable
          </button>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">My Files</h2>
          <p className="text-sm text-gray-600">These are the documents you already sent.</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">My Files</h2>
          <p className="text-sm text-gray-600">These are the documents you already sent.</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">No files yet.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">My Files</h2>
        <p className="text-sm text-gray-600">These are the documents you already sent.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Size</th>
              <th className="text-left py-3 px-2 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b border-gray-100">
                <td className="py-3 px-2 text-gray-600">
                  {formatDateLocal(file.createdAtUtc)}
                </td>
                <td className="py-3 px-2">
                  <StatusBadge 
                    status={file.status} 
                    failureReason={file.failureReason}
                  />
                </td>
                <td className="py-3 px-2 text-gray-600">
                  {file.status === 'Success' && file.convertedSizeKB 
                    ? `${file.convertedSizeKB} KB` 
                    : '-'
                  }
                </td>
                <td className="py-3 px-2">
                  {getActionButton(file)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
