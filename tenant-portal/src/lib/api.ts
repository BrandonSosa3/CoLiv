import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tenant_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    
    const { data } = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return data
  },
}

// Tenant API
export const tenantApi = {
  getProfile: async () => {
    const { data } = await apiClient.get('/tenants/me')
    return data
  },
  
  getLeaseInfo: async () => {
    const { data } = await apiClient.get('/tenants/me/lease')
    return data
  },
}

// Payments API
export const paymentsApi = {
  getMyPayments: async () => {
    const { data } = await apiClient.get('/tenants/me/payments')
    return data
  },
}

// Maintenance API
export const maintenanceApi = {
  getMyRequests: async () => {
    const { data } = await apiClient.get('/tenants/me/maintenance')
    return data
  },
  
  create: async (request: {
    title: string
    description: string
    priority: string
  }) => {
    const { data } = await apiClient.post('/tenants/me/maintenance', request)
    return data
  },
}

// Announcements API
export const announcementsApi = {
  getMyAnnouncements: async () => {
    const { data } = await apiClient.get('/tenants/me/announcements')
    return data
  },
}
