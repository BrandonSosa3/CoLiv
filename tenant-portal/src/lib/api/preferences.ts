import { apiClient } from './client'

export interface TenantPreference {
  id: string
  tenant_id: string
  cleanliness_importance: number
  noise_tolerance: number
  guest_frequency: number
  sleep_schedule: string
  work_schedule: string
  social_preference: number
  smoking: boolean
  pets: boolean
  interests?: string
  about_me?: string
  dietary_restrictions?: string
  created_at: string
  updated_at: string
}

export interface TenantPreferenceUpdate {
  cleanliness_importance?: number
  noise_tolerance?: number
  guest_frequency?: number
  sleep_schedule?: string
  work_schedule?: string
  social_preference?: number
  smoking?: boolean
  pets?: boolean
  interests?: string
  about_me?: string
  dietary_restrictions?: string
}

export const preferencesApi = {
  getMy: async () => {
    const { data } = await apiClient.get<TenantPreference>('/preferences/me')
    return data
  },

  updateMy: async (data: TenantPreferenceUpdate) => {
    const { data: response } = await apiClient.put<TenantPreference>('/preferences/me', data)
    return response
  },
}
