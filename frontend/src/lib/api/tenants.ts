import { apiClient } from './client'
import { Tenant, TenantWithUser } from '@/types'

export const tenantsApi = {
  getByProperty: async (propertyId: string): Promise<TenantWithUser[]> => {
    const { data } = await apiClient.get<TenantWithUser[]>(`/tenants/property/${propertyId}`)
    return data
  },

  getByRoom: async (roomId: string): Promise<TenantWithUser[]> => {
    const { data } = await apiClient.get<TenantWithUser[]>(`/tenants/room/${roomId}`)
    return data
  },

  create: async (tenant: {
    email: string
    password?: string
    room_id: string
    lease_start: string
    lease_end: string
    rent_amount: number
    deposit_paid?: number
    status?: string
  }): Promise<Tenant> => {
    const { data } = await apiClient.post<Tenant>('/tenants/', tenant)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`)
  },
}
