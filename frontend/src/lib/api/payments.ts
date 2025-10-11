import { apiClient } from './client'

export interface Payment {
  id: string
  tenant_id: string
  amount: number
  payment_date: string | null
  payment_method: string
  status: 'pending' | 'paid' | 'overdue' | 'failed'
  due_date: string
  created_at: string
}

export interface PaymentWithDetails extends Payment {
  tenant_email: string
  room_number: string
  unit_number: string
  property_name: string
}

export const paymentsApi = {
  getByProperty: async (propertyId: string): Promise<PaymentWithDetails[]> => {
    const { data } = await apiClient.get<PaymentWithDetails[]>(`/payments/property/${propertyId}`)
    return data
  },

  create: async (payment: {
    tenant_id: string
    room_id: string
    amount: number
    due_date: string
    payment_method: string
    status: string
  }): Promise<Payment> => {
    const { data } = await apiClient.post<Payment>('/payments/', payment)
    return data
  },

  update: async (id: string, updates: { status?: string; paid_date?: string }): Promise<Payment> => {
    const { data } = await apiClient.put<Payment>(`/payments/${id}`, updates)
    return data
  },
}
