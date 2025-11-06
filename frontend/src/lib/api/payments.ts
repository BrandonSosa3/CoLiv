import { apiClient } from './client'

export interface Payment {
  id: string
  tenant_id: string
  room_id: string
  amount: string
  due_date: string
  paid_date: string | null
  payment_method: string | null
  late_fee: string
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
}

export interface PaymentWithDetails extends Payment {
  tenant_email: string
  property_name: string
  unit_number: string
  room_number: string
}

export interface RecurringPaymentResponse {
  message: string
  generated_count: number
  due_date: string
  month: string
}

export const paymentsApi = {
  create: async (payment: {
    tenant_id: string
    room_id: string
    amount: number
    due_date: string
    payment_method?: string
    status?: string
  }): Promise<Payment> => {
    const { data } = await apiClient.post<Payment>('/payments/', payment)
    return data
  },

  getByProperty: async (propertyId: string): Promise<PaymentWithDetails[]> => {
    const { data } = await apiClient.get<PaymentWithDetails[]>(
      `/payments/property/${propertyId}`
    )
    return data
  },

  update: async (
    paymentId: string,
    updates: Partial<Payment>
  ): Promise<Payment> => {
    const { data } = await apiClient.put<Payment>(`/payments/${paymentId}`, updates)
    return data
  },

  markAsPaid: async (paymentId: string): Promise<Payment> => {
    const { data } = await apiClient.put<Payment>(`/payments/${paymentId}`, {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    })
    return data
  },

  generateRecurring: async (): Promise<RecurringPaymentResponse> => {
    const { data } = await apiClient.post<RecurringPaymentResponse>('/payments/generate-recurring')
    return data
  },
}
