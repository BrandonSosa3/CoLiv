import { apiClient } from './client'
import { Property } from '@/types'

export const propertiesApi = {
  getAll: async (): Promise<Property[]> => {
    const { data } = await apiClient.get<Property[]>('/properties/')
    return data
  },

  getById: async (id: string): Promise<Property> => {
    const { data } = await apiClient.get<Property>(`/properties/${id}`)
    return data
  },

  create: async (
    property: Omit<Property, 'id' | 'operator_id' | 'created_at'>
  ): Promise<Property> => {
    const { data } = await apiClient.post<Property>('/properties/', property)
    return data
  },

  update: async (id: string, property: Partial<Property>): Promise<Property> => {
    const { data } = await apiClient.put<Property>(`/properties/${id}`, property)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`)
  },
}
