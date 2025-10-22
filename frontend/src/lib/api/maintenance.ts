import { apiClient } from './client'

export interface MaintenanceRequest {
  id: string
  property_id: string
  unit_id: string
  room_id?: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  created_at: string
  resolved_at?: string
}

export interface MaintenanceWithDetails extends MaintenanceRequest {
  property_name: string
  room_number: string
  unit_number: string
  reporter_email: string
}

export const maintenanceApi = {
  getByProperty: async (propertyId: string): Promise<MaintenanceWithDetails[]> => {
    const { data } = await apiClient.get<MaintenanceWithDetails[]>(
      `/maintenance/property/${propertyId}`
    )
    return data
  },

  create: async (request: {
    property_id: string
    unit_id: string
    room_id: string | null
    title: string
    description: string
    priority: string
  }): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.post<MaintenanceRequest>('/maintenance/', request)
    return data
  },

  update: async (
    id: string,
    updates: Partial<MaintenanceRequest>
  ): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.put<MaintenanceRequest>(`/maintenance/${id}`, updates)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}`)
  },
}
