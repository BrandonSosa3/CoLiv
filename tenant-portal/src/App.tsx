import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { PreferencesPage } from './pages/PreferencesPage'
import { TenantLayout } from './components/TenantLayout'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('tenant_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            element={
              <ProtectedRoute>
                <TenantLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c1e',
              border: '1px solid #2c2c2e',
              color: '#fffffe',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
