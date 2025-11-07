import React, { useState, useRef } from 'react'
import { UploadResponse } from '../types/api'

interface UploadCardProps {
  onUploadSuccess: () => void
}

/**
 * Upload card component for PDF file uploads
 * Handles file selection, validation, and upload process
 */
export function UploadCard({ onUploadSuccess }: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setStatusMessage('Please select a PDF file.')
        setStatusType('error')
        setSelectedFile(null)
        return
      }
      
      setSelectedFile(file)
      setStatusMessage('')
      setStatusType(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!selectedFile) {
      setStatusMessage('Please select a file to upload.')
      setStatusType('error')
      return
    }

    setIsUploading(true)
    setStatusMessage('')
    setStatusType(null)

    try {
      // Mock upload - no backend required
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful upload response
      const mockResponse: UploadResponse = {
        success: true,
        fileId: 'mock-file-' + Date.now(),
        status: 'Success',
        message: 'File uploaded successfully! (Demo mode)'
      }

      setStatusMessage(mockResponse.message)
      setStatusType('success')
      setSelectedFile(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component to refresh file list
      onUploadSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      setStatusMessage('Upload failed. Please try again.')
      setStatusType('error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload PDF</h2>
        <p className="text-sm text-gray-600">
          Send your document. We will convert it to the official format automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
            Choose PDF File
          </label>
          <input
            ref={fileInputRef}
            id="pdfFile"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload and Convert'}
        </button>

        {statusMessage && (
          <div
            className={`text-sm p-3 rounded-lg ${
              statusType === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {statusMessage}
          </div>
        )}
      </form>
    </div>
  )
}
