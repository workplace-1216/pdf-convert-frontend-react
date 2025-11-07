import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { CompanyRegistrationPage } from './pages/CompanyRegistrationPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { DocumentManagementPage } from './pages/DocumentManagementPage'
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage'
import { ClientReadyDocumentsPage } from './pages/ClientReadyDocumentsPageNew'
import { CompanyDashboardPage } from './pages/CompanyDashboardPage'
import { CompanyNotificationsPage } from './pages/CompanyNotificationsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { AdminLayout } from './components/AdminLayout'
import { ClientLayout } from './components/ClientLayout'
import { AdminNotificationsPage } from './pages/AdminNotificationsPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-company" element={<CompanyRegistrationPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/client" element={
            <ProtectedRoute>
              <ClientLayout>
                <ClientReadyDocumentsPage />
              </ClientLayout>
            </ProtectedRoute>
          } />
          <Route path="/company" element={
            <ProtectedRoute>
              <CompanyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/company/notifications" element={
            <ProtectedRoute>
              <CompanyNotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/documents" element={
            <ProtectedRoute>
              <AdminLayout>
                <DocumentManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <AdminLayout>
                <ReportsAnalyticsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/templates" element={
            <ProtectedRoute>
              <AdminLayout>
                <TemplatesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminNotificationsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/client" replace />} />
          <Route path="*" element={<Navigate to="/client" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App