import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { TenantsPage } from './pages/TenantsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c1e',
              border: '1px solid #2c2c2e',
              color: '#ffffff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
