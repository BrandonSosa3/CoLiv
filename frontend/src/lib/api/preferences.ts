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
  overnight_guests: boolean
  interests: string
  notes: string
}

export interface RoommateMatch {
  tenant_id: string
  email: string
  current_room_id: string
  compatibility_score: number
  breakdown: {
    cleanliness: number
    noise: number
    sleep_schedule: number
    social: number
    guests: number
    work_schedule: number
    dealbreakers: number
    interests: number
  }
  common_interests: string[]
}

export const preferencesApi = {
  create: async (preference: {
    tenant_id: string
    cleanliness_importance: number
    noise_tolerance: number
    guest_frequency: number
    sleep_schedule: string
    work_schedule: string
    social_preference: number
    smoking: boolean
    pets: boolean
    overnight_guests: boolean
    interests: string
    notes: string
  }): Promise<TenantPreference> => {
    const { data } = await apiClient.post<TenantPreference>('/preferences/', preference)
    return data
  },

  getByTenant: async (tenantId: string): Promise<TenantPreference | null> => {
    try {
      const { data } = await apiClient.get<TenantPreference>(`/preferences/tenant/${tenantId}`)
      return data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  update: async (
    preferenceId: string,
    updates: Partial<TenantPreference>
  ): Promise<TenantPreference> => {
    const { data } = await apiClient.put<TenantPreference>(`/preferences/${preferenceId}`, updates)
    return data
  },

  getMatches: async (tenantId: string, topN: number = 5): Promise<RoommateMatch[]> => {
    const { data } = await apiClient.get<RoommateMatch[]>(`/preferences/matches/${tenantId}?top_n=${topN}`)
    return data
  },
}
