import axios, { AxiosResponse } from 'axios'
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterVendorResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  VerifyLoginOTPRequest,
  VerifyLoginOTPResponse,
  User,
  Document,
  DocumentUploadResponse,
  TemplateRuleSet,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  AdminStats,
  AdminUser,
  AdminDocument,
  ReportsAnalyticsResponse,
  CreateAdminRequest,
  PagedResult
} from '../types/api'
import { API_URL } from '../config/api.config'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/auth/login', credentials).then((res: AxiosResponse<LoginResponse>) => res.data),

  registerVendor: (userData: RegisterRequest): Promise<RegisterVendorResponse> =>
    api.post('/auth/register', userData).then((res: AxiosResponse<RegisterVendorResponse>) => res.data),

  verifyOTP: (data: VerifyOTPRequest): Promise<VerifyOTPResponse> =>
    api.post('/auth/verify-otp', data).then((res: AxiosResponse<VerifyOTPResponse>) => res.data),

  resendOTP: (data: ResendOTPRequest): Promise<ResendOTPResponse> =>
    api.post('/auth/resend-otp', data).then((res: AxiosResponse<ResendOTPResponse>) => res.data),

  verifyLoginOTP: (data: VerifyLoginOTPRequest): Promise<VerifyLoginOTPResponse> =>
    api.post('/auth/verify-login-otp', data).then((res: AxiosResponse<VerifyLoginOTPResponse>) => res.data),

  getCurrentUser: (): Promise<User> =>
    api.get('/auth/me').then((res: AxiosResponse<User>) => res.data),
}

export const documentApi = {
  getAdmins: (): Promise<Array<{ id: string; name: string; email: string }>> =>
    api.get('/documents/admins').then((res: AxiosResponse<Array<{ id: string; name: string; email: string }>>) => res.data),

  upload: (file: File, templateId: number, batchId?: string): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('templateId', templateId.toString())
    if (batchId) formData.append('batchId', batchId)

    const uploadApi = axios.create({
      baseURL: API_URL,
    })

    const token = localStorage.getItem('token')
    if (token) {
      uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    return uploadApi.post('/documents/upload', formData).then((res: AxiosResponse<DocumentUploadResponse>) => res.data)
  },
  
  getProcessedDocuments: (): Promise<Document[]> =>
    api.get('/documents/processed').then((res: AxiosResponse<{documents: Document[], totalCount: number}>) => res.data.documents),
  
  download: (documentId: number): Promise<Blob> =>
    api.get(`/documents/processed/${documentId}/file`, {
      responseType: 'blob'
    }).then((res: AxiosResponse<Blob>) => res.data),

  downloadBatch: (documentIds: number[]): Promise<Blob> =>
    api.post('/documents/processed/download-batch', { documentIds }, { responseType: 'blob' })
       .then((res: AxiosResponse<Blob>) => res.data),

  deleteBatch: (documentIds: number[]): Promise<{ deleted: number }> =>
    api.post('/documents/processed/delete-batch', { documentIds })
       .then((res: AxiosResponse<{ deleted: number }>) => res.data),

  sendByEmail: (documentIds: number[], adminId?: string, toEmail?: string): Promise<{ 
    status: string; 
    to: string; 
    subject: string;
    documentCount: number;
    totalSizeBytes: number;
    zipSizeBytes: number;
    compressionRatio: number;
  }> =>
    api.post('/documents/processed/send-email', { documentIds, adminId, toEmail })
       .then((res: AxiosResponse<{ 
         status: string; 
         to: string; 
         subject: string;
         documentCount: number;
         totalSizeBytes: number;
         zipSizeBytes: number;
         compressionRatio: number;
       }>) => res.data),

  getNotifications: (): Promise<any[]> =>
    api.get('/notification').then((res: AxiosResponse<any[]>) => res.data),

  markNotificationAsRead: (id: number): Promise<void> =>
    api.put(`/notification/${id}/read`).then(() => {}),

  deleteNotification: (id: number): Promise<void> =>
    api.delete(`/notification/${id}`).then(() => {}),

  clearAllNotifications: (): Promise<void> =>
    api.delete('/notification').then(() => {}),
}

export const templateApi = {
  getAll: (): Promise<TemplateRuleSet[]> =>
    api.get('/templates').then((res: AxiosResponse<TemplateRuleSet[]>) => res.data),
  
  getById: (id: number): Promise<TemplateRuleSet> =>
    api.get(`/templates/${id}`).then((res: AxiosResponse<TemplateRuleSet>) => res.data),
  
  create: (template: CreateTemplateRequest): Promise<TemplateRuleSet> =>
    api.post('/templates', template).then((res: AxiosResponse<TemplateRuleSet>) => res.data),
  
  update: (id: number, template: UpdateTemplateRequest): Promise<TemplateRuleSet> =>
    api.put(`/templates/${id}`, template).then((res: AxiosResponse<TemplateRuleSet>) => res.data),
  
  delete: (id: number): Promise<void> =>
    api.delete(`/templates/${id}`).then(() => {}),
}

export const companyApi = {
  verifyOTP: (data: VerifyOTPRequest): Promise<VerifyOTPResponse> =>
    api.post('/companies/verify-otp', data).then((res: AxiosResponse<VerifyOTPResponse>) => res.data),

  resendOTP: (data: ResendOTPRequest): Promise<ResendOTPResponse> =>
    api.post('/companies/resend-otp', data).then((res: AxiosResponse<ResendOTPResponse>) => res.data),
}

export const adminApi = {
  getStats: (): Promise<AdminStats> =>
    api.get('/admin/stats').then((res: AxiosResponse<AdminStats>) => res.data),
  
  getUsers: (page = 1, pageSize = 10, search?: string, role?: string, status?: string): Promise<PagedResult<AdminUser>> =>
    api.get('/admin/users', {
      params: { page, pageSize, search, role, status }
    }).then((res: AxiosResponse<PagedResult<AdminUser>>) => res.data),
  
  getDocuments: (page = 1, pageSize = 10, search?: string, status?: string): Promise<PagedResult<AdminDocument>> =>
    api.get('/admin/documents', {
      params: { page, pageSize, search, status }
    }).then((res: AxiosResponse<PagedResult<AdminDocument>>) => res.data),
  
  createAdmin: (request: CreateAdminRequest): Promise<AdminUser> =>
    api.post('/admin/users', request).then((res: AxiosResponse<AdminUser>) => res.data),
  
  updateUser: (userId: string, data: { name?: string; email?: string; status?: string }): Promise<AdminUser> =>
    api.put(`/admin/users/${userId}`, data).then((res: AxiosResponse<AdminUser>) => res.data),
  
  deleteUser: (userId: string): Promise<void> =>
    api.delete(`/admin/users/${userId}`).then(() => {}),
  
  deleteDocuments: (documentIds: string[]): Promise<{ message: string; deletedCount: number }> =>
    api.delete('/admin/documents', { data: { documentIds } }).then((res: AxiosResponse<{ message: string; deletedCount: number }>) => res.data),

  getAnalytics: (period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ReportsAnalyticsResponse> =>
    api.get('/admin/analytics', {
      params: { period }
    }).then((res: AxiosResponse<ReportsAnalyticsResponse>) => res.data),

  downloadDocument: (documentId: string): Promise<Blob> =>
    api.get(`/documents/processed/${documentId}/file`, {
      responseType: 'blob'
    }).then((res: AxiosResponse<Blob>) => res.data),
}
