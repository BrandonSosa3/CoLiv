import { apiClient } from './client.ts'

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

export interface TenantPreferenceCreate {
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
  // Operator endpoints
  create: async (tenantId: string, data: TenantPreferenceCreate) => {
    const response = await apiClient.post<TenantPreference>(`/preferences/?tenant_id=${tenantId}`, data)
    return response.data
  },

  getByTenant: async (tenantId: string) => {
    const { data } = await apiClient.get<TenantPreference>(`/preferences/${tenantId}`)
    return data
  },

  update: async (tenantId: string, data: Partial<TenantPreferenceCreate>) => {
    const { data: response } = await apiClient.put<TenantPreference>(`/preferences/${tenantId}`, data)
    return response
  },

  delete: async (tenantId: string) => {
    const { data } = await apiClient.delete(`/preferences/${tenantId}`)
    return data
  },
}
