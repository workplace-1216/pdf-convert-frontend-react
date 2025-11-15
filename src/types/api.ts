export interface User {
  id: number
  email: string
  role: 'Admin' | 'Client' | 'Company'
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  role: string
}

export interface RegisterRequest {
  email: string
  tempPassword: string
  rfc?: string
  whatsappNumber?: string
  role?: 'Admin' | 'Client' | 'Company'
}

export interface RegisterVendorResponse {
  userId: number
  email: string
  role: string
  message: string
  requiresEmailVerification: boolean
}

export interface VerifyOTPRequest {
  email: string
  otpCode: string
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  email?: string
}

export interface ResendOTPRequest {
  email: string
}

export interface ResendOTPResponse {
  success: boolean
  message: string
}

export interface VerifyLoginOTPRequest {
  email: string
  otpCode: string
}

export interface VerifyLoginOTPResponse {
  success: boolean
  token: string
  role: string
  user: {
    id: number
    email: string
    role: string
    rfc?: string
  }
}

export interface Document {
  id: number
  originalFileName: string
  fileSizeBytes: number
  status: 'Uploaded' | 'Processing' | 'ReadyForPreview' | 'Approved' | 'Rejected'
  uploadedAt: string
  finalPdfPath?: string
  extractedData?: Record<string, any>
}

export interface DocumentUploadRequest {
  file: File
  templateRuleSetId?: number
}

export interface DocumentUploadResponse {
  success: boolean
  message: string
  documentId: number
  fileName: string
  fileSize: number
  processingTimeMs: number
}

export interface DocumentConfirmRequest {
  sourceDocumentTempId: string
  templateId: string
  extractedData: Record<string, any>
  finalPdfBase64: string
}

export interface DocumentPreviewResponse {
  documentId: number
  previewPdfPath: string
  extractedData: Record<string, any>
  isReadyForApproval: boolean
}

export interface DocumentApprovalRequest {
  documentId: number
  approved: boolean
  comments?: string
}

export interface TemplateRuleSet {
  id: number
  name: string
  jsonDefinition: string
  createdByUserId: number
  createdAt: string
  isActive: boolean
}

export interface CreateTemplateRequest {
  name: string
  jsonDefinition: string
}

export interface UpdateTemplateRequest {
  name: string
  jsonDefinition: string
  isActive: boolean
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Admin-specific types
export interface AdminStats {
  totalDocuments: number
  processedDocuments: number
  pendingDocuments: number
  errorDocuments: number
  totalUsers: number
  activeUsers: number
  processedToday: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  documentsCount: number
  rfc?: string | null
}

export interface AdminDocument {
  id: string
  fileName: string
  uploader: string
  uploadDate: string
  status: string
  fileSize: string
  documentType: string
  extractedData: {
    rfc: string
    periodo: string
    monto: string
  }
}

export interface CreateAdminRequest {
  name: string
  email: string
  password: string
  whatsappNumber?: string
}

// Reports & Analytics
export interface ReportsAnalyticsResponse {
  stats: ReportsStats
  monthlyTrends: MonthlyTrend[]
  userActivity: UserActivityPoint[]
  documentTypes: NameValue[]
  processingTime: RangeCount[]
  errorTypes: ErrorType[]
}

export interface ReportsStats {
  totalDocuments: number
  processedToday: number
  averageProcessingTime: string
  successRate: number
  totalUsers: number
  activeUsers: number
  growthRate: number
}

export interface MonthlyTrend {
  month: string
  documents: number
  processed: number
  sent: number
  errors: number
}

export interface UserActivityPoint {
  time: string
  users: number
  documents: number
}

export interface NameValue {
  name: string
  value: number
}

export interface RangeCount {
  range: string
  count: number
}

export interface ErrorType {
  type: string
  count: number
  percentage: number
}

// Supplier types
export interface FileItem {
  id: string
  fileName: string
  uploadDate: string
  createdAtUtc: string
  status: 'Success' | 'Pending' | 'Failed'
  fileSize: number
  convertedSizeKB: number
  convertedAvailable: boolean
  failureReason?: string | null
}

export interface UploadResponse {
  success: boolean
  status: string
  message: string
  fileId?: string
}