import { apiClient } from './client'
import { Unit } from '@/types'

export const unitsApi = {
  getByProperty: async (propertyId: string): Promise<Unit[]> => {
    const { data } = await apiClient.get(`/units/property/${propertyId}`)
    return data
  },

  create: async (unit: Omit<Unit, 'id' | 'created_at'>): Promise<Unit> => {
    const { data } = await apiClient.post('/units/', unit)
    return data
  },

  update: async (id: string, unit: Partial<Unit>): Promise<Unit> => {
    const { data } = await apiClient.put(`/units/${id}`, unit)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/units/${id}`)
  },
}
