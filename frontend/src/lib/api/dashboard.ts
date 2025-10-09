import { apiClient } from './client'
import { Dashboard } from '@/types'

export const dashboardApi = {
  getOperatorMetrics: async (): Promise<{
    total_properties: number
    total_units: number
    total_rooms: number
    occupied_rooms: number
    total_revenue: number
  }> => {
    const { data } = await apiClient.get('/dashboard/operator')
    return data
  },

  getPropertyMetrics: async (propertyId: string): Promise<Dashboard> => {
    const { data } = await apiClient.get(`/dashboard/property/${propertyId}`)
    return data
  },
}
