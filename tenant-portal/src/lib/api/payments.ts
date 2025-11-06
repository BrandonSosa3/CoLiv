import { apiClient } from '../api'

export interface TenantPayment {
  id: string
  amount: string
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue' | 'failed'
  payment_method: string
  late_fee: string
  created_at: string
}

export const paymentsApi = {
  getMyPayments: async (): Promise<TenantPayment[]> => {
    const { data } = await apiClient.get<TenantPayment[]>('/tenants/me/payments')
    return data
  },
}