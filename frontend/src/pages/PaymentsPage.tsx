import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { LoadingScreen } from '@/components/ui/Spinner'
import { DollarSign, CheckCircle, Clock, AlertCircle, Plus, Calendar, Users } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { CreatePaymentModal } from '@/components/payments/CreatePaymentModal'

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data } = await apiClient.get('/properties')
      return data
    },
  })

  const { data: allPayments, isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      if (!properties || properties.length === 0) return []
      
      const allPaymentsData = await Promise.all(
        properties.map(async (property: any) => {
          const { data } = await apiClient.get(`/payments/property/${property.id}`)
          return data
        })
      )
      
      return allPaymentsData.flat()
    },
    enabled: !!properties && properties.length > 0,
  })

  const generateRecurringMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/payments/generate-recurring')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] })
      toast.success(data.message)
      setShowGenerateDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate payments')
    },
  })

  if (isLoading) {
    return <LoadingScreen message="Loading payments..." />
  }

  const payments = allPayments || []

  // Apply filters
  const filteredPayments = payments.filter((payment: any) => {
    if (selectedProperty !== 'all' && payment.property_name !== selectedProperty) {
      return false
    }
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false
    }
    return true
  })

  // Calculate stats
  const totalPaid = payments
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  const totalPending = payments
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  const totalOverdue = payments.filter((p: any) => p.status === 'overdue').length

  const propertyOptions = [
    { value: 'all', label: 'All Properties' },
    ...(properties?.map((p: any) => ({ value: p.name, label: p.name })) || []),
  ]

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'failed', label: 'Failed' },
  ]

  const statusColors: Record<string, string> = {
    paid: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    pending: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    overdue: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
    failed: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-[#98989d] mt-1">
            Manage rent payments and track payment history
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payment
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            variant="secondary"
            disabled={generateRecurringMutation.isPending}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {generateRecurringMutation.isPending ? 'Generating...' : 'Generate Monthly Payments'}
          </Button>
        </div>
      </div>
      {/* Generate Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-[#2c2c2e]">
              <h2 className="text-xl font-semibold text-white">Generate Monthly Payments</h2>
              <p className="text-sm text-[#98989d] mt-2">
                This will create payment records for all active tenants for the current month if they don't already exist.
              </p>
            </div>
            <div className="p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowGenerateDialog(false)}
                  disabled={generateRecurringMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateRecurringMutation.mutate()}
                  disabled={generateRecurringMutation.isPending}
                >
                  {generateRecurringMutation.isPending ? 'Generating...' : 'Generate Payments'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#32d74b]/20">
                <CheckCircle className="w-6 h-6 text-[#32d74b]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Paid</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#ffd60a]/20">
                <Clock className="w-6 h-6 text-[#ffd60a]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Pending</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#ff453a]/20">
                <AlertCircle className="w-6 h-6 text-[#ff453a]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Overdue</p>
                <p className="text-2xl font-bold text-white">{totalOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#667eea]/20">
                <DollarSign className="w-6 h-6 text-[#667eea]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Payments</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <FilterDropdown
          label="Property"
          value={selectedProperty}
          onChange={setSelectedProperty}
          options={propertyOptions}
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#636366]" />
              <p className="text-[#98989d]">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2c2c2e]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Tenant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Property</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Unit/Room</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Paid Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-[#2c2c2e] hover:bg-[#1c1c1e] transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {payment.tenant_first_name} {payment.tenant_last_name}
                          </p>
                          <p className="text-sm text-[#98989d]">{payment.tenant_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{payment.property_name}</td>
                      <td className="py-3 px-4">
                        <p className="text-white">Unit {payment.unit_number}</p>
                        <p className="text-sm text-[#98989d]">Room {payment.room_number}</p>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3 px-4 text-[#98989d]">{formatDate(payment.due_date)}</td>
                      <td className="py-3 px-4">
                        {payment.payment_date ? (
                          <span className="text-[#32d74b]">{formatDate(payment.payment_date)}</span>
                        ) : (
                          <span className="text-[#636366]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
EOFcat > frontend/src/pages/PaymentsPage.tsx << 'EOF'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { LoadingScreen } from '@/components/ui/Spinner'
import { DollarSign, CheckCircle, Clock, AlertCircle, Plus, Calendar, Users } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { CreatePaymentModal } from '@/components/payments/CreatePaymentModal'

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data } = await apiClient.get('/properties')
      return data
    },
  })

  const { data: allPayments, isLoading } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      if (!properties || properties.length === 0) return []
      
      const allPaymentsData = await Promise.all(
        properties.map(async (property: any) => {
          const { data } = await apiClient.get(`/payments/property/${property.id}`)
          return data
        })
      )
      
      return allPaymentsData.flat()
    },
    enabled: !!properties && properties.length > 0,
  })

  const generateRecurringMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/payments/generate-recurring')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] })
      toast.success(data.message)
      setShowGenerateDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate payments')
    },
  })

  if (isLoading) {
    return <LoadingScreen message="Loading payments..." />
  }

  const payments = allPayments || []

  // Apply filters
  const filteredPayments = payments.filter((payment: any) => {
    if (selectedProperty !== 'all' && payment.property_name !== selectedProperty) {
      return false
    }
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false
    }
    return true
  })

  // Calculate stats
  const totalPaid = payments
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  const totalPending = payments
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  const totalOverdue = payments.filter((p: any) => p.status === 'overdue').length

  const propertyOptions = [
    { value: 'all', label: 'All Properties' },
    ...(properties?.map((p: any) => ({ value: p.name, label: p.name })) || []),
  ]

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'failed', label: 'Failed' },
  ]

  const statusColors: Record<string, string> = {
    paid: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    pending: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    overdue: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
    failed: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-[#98989d] mt-1">
            Manage rent payments and track payment history
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payment
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            variant="secondary"
            disabled={generateRecurringMutation.isPending}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {generateRecurringMutation.isPending ? 'Generating...' : 'Generate Monthly Payments'}
          </Button>
        </div>
      </div>
      {/* Generate Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-[#2c2c2e]">
              <h2 className="text-xl font-semibold text-white">Generate Monthly Payments</h2>
              <p className="text-sm text-[#98989d] mt-2">
                This will create payment records for all active tenants for the current month if they don't already exist.
              </p>
            </div>
            <div className="p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowGenerateDialog(false)}
                  disabled={generateRecurringMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateRecurringMutation.mutate()}
                  disabled={generateRecurringMutation.isPending}
                >
                  {generateRecurringMutation.isPending ? 'Generating...' : 'Generate Payments'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#32d74b]/20">
                <CheckCircle className="w-6 h-6 text-[#32d74b]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Paid</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#ffd60a]/20">
                <Clock className="w-6 h-6 text-[#ffd60a]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Pending</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#ff453a]/20">
                <AlertCircle className="w-6 h-6 text-[#ff453a]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Overdue</p>
                <p className="text-2xl font-bold text-white">{totalOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#667eea]/20">
                <DollarSign className="w-6 h-6 text-[#667eea]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Payments</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <FilterDropdown
          label="Property"
          value={selectedProperty}
          onChange={setSelectedProperty}
          options={propertyOptions}
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#636366]" />
              <p className="text-[#98989d]">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2c2c2e]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Tenant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Property</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Unit/Room</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Paid Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#98989d]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-[#2c2c2e] hover:bg-[#1c1c1e] transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {payment.tenant_first_name} {payment.tenant_last_name}
                          </p>
                          <p className="text-sm text-[#98989d]">{payment.tenant_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{payment.property_name}</td>
                      <td className="py-3 px-4">
                        <p className="text-white">Unit {payment.unit_number}</p>
                        <p className="text-sm text-[#98989d]">Room {payment.room_number}</p>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3 px-4 text-[#98989d]">{formatDate(payment.due_date)}</td>
                      <td className="py-3 px-4">
                        {payment.payment_date ? (
                          <span className="text-[#32d74b]">{formatDate(payment.payment_date)}</span>
                        ) : (
                          <span className="text-[#636366]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
