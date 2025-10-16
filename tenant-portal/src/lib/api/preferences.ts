import { apiClient } from '../api'

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
  getMy: async (): Promise<TenantPreference> => {
    const { data } = await apiClient.get<TenantPreference>('/preferences/me')
    return data
  },

  createMy: async (preference: Omit<TenantPreference, 'id' | 'tenant_id'>): Promise<TenantPreference> => {
    const { data } = await apiClient.post<TenantPreference>('/preferences/me', preference)
    return data
  },

  updateMy: async (updates: Partial<TenantPreference>): Promise<TenantPreference> => {
    const { data } = await apiClient.put<TenantPreference>('/preferences/me', updates)
    return data
  },

  getMyMatches: async (topN: number = 5): Promise<RoommateMatch[]> => {
    const { data } = await apiClient.get<RoommateMatch[]>(`/preferences/my-matches?top_n=${topN}`)
    return data
  },
}
