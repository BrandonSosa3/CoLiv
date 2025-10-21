import { apiClient } from './client'
import { Room } from '@/types'

export const roomsApi = {
  getByUnit: async (unitId: string): Promise<Room[]> => {
    const { data } = await apiClient.get(`/rooms/unit/${unitId}`)
    return data
  },

  getByProperty: async (propertyId: string): Promise<Room[]> => {
    const { data } = await apiClient.get(`/rooms/property/${propertyId}`)
    return data
  },

  create: async (room: Omit<Room, 'id' | 'created_at' | 'current_tenant_id'>): Promise<Room> => {
    const { data } = await apiClient.post('/rooms/', room)
    return data
  },

  update: async (id: string, room: Partial<Room>): Promise<Room> => {
    const { data } = await apiClient.put(`/rooms/${id}`, room)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`)
  },
}
