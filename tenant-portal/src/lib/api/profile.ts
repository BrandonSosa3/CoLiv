import { apiClient } from '../api'

export interface TenantProfile {
  id: string
  email: string
  status: string
  lease_start: string
  lease_end: string
  rent_amount: string
  created_at: string
}

export interface LeaseInfo {
  property_name: string
  unit_number: string
  room_number: string
  lease_start: string
  lease_end: string
  rent_amount: number
  status: string
}

export const profileApi = {
  getProfile: async (): Promise<TenantProfile> => {
    const { data } = await apiClient.get('/tenants/me/profile')
    return data
  },

  getLeaseInfo: async (): Promise<LeaseInfo> => {
    const { data } = await apiClient.get('/tenants/me/lease')
    return data
  },

  updateProfile: async (email: string) => {
    const { data } = await apiClient.put('/tenants/me/profile', { email })
    return data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await apiClient.post('/tenants/me/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return data
  },
}
