import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api/properties'
import { paymentsApi } from '@/lib/api/payments'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingScreen } from '@/components/ui/Spinner'
import { DollarSign, CheckCircle, Clock, AlertCircle, Calendar, Plus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const paymentsQuery = useQuery({
    queryKey: ['all-payments', properties?.map(p => p.id)],
    queryFn: async () => {
      if (!properties) return []
      const paymentsPromises = properties.map(p => paymentsApi.getByProperty(p.id))
      const paymentsArrays = await Promise.all(paymentsPromises)
      return paymentsArrays.flat()
    },
    enabled: !!properties,
  })

  const markAsPaidMutation = useMutation({
    mutationFn: (paymentId: string) =>
      paymentsApi.update(paymentId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] })
      toast.success('Payment marked as paid')
    },
    onError: () => {
      toast.error('Failed to update payment')
    },
  })

  // Add the generate recurring payments mutation
  const generateRecurringMutation = useMutation({
    mutationFn: paymentsApi.generateRecurring,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] })
      toast.success(data.message)
      setShowGenerateDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate payments')
    },
  })

  if (paymentsQuery.isLoading) {
    return <LoadingScreen message="Loading payments..." />
  }

  const allPayments = paymentsQuery.data || []

  // Apply filters
  const filteredPayments = allPayments.filter((payment) => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false
    if (propertyFilter !== 'all' && payment.property_name !== propertyFilter) return false

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        payment.tenant_email.toLowerCase().includes(searchLower) ||
        payment.property_name.toLowerCase().includes(searchLower) ||
        payment.unit_number.toLowerCase().includes(searchLower) ||
        payment.room_number.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const paidPayments = allPayments.filter(p => p.status === 'paid')
  const pendingPayments = allPayments.filter(p => p.status === 'pending')
  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Calculate next month for display
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const statusIcons = {
    paid: <CheckCircle className="w-5 h-5 text-[#32d74b]" />,
    pending: <Clock className="w-5 h-5 text-[#ffd60a]" />,
    overdue: <AlertCircle className="w-5 h-5 text-[#ff453a]" />,
    failed: <AlertCircle className="w-5 h-5 text-[#ff453a]" />,
  }

  const statusColors = {
    paid: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    pending: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    overdue: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
    failed: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  return (
    <div className="space-y-8">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-[#98989d] mt-2">
            Track rent payments across all properties
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateDialog(true)}
          disabled={generateRecurringMutation.isPending}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {generateRecurringMutation.isPending ? 'Generating...' : 'Generate Monthly Payments'}
        </Button>
      </div>

      {/* Generate Payments Confirmation Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-[#2c2c2e]">
              <h2 className="text-xl font-semibold text-white">Generate Monthly Payments</h2>
            </div>
            <div className="p-6">
              <p className="text-[#98989d] mb-6">
                This will automatically create rent payment records for all active tenants for <strong className="text-white">{nextMonthName}</strong>.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
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
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Payments</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allPayments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Paid</p>
            <p className="text-2xl font-bold text-white mt-1">
              {paidPayments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Pending</p>
            <p className="text-2xl font-bold text-white mt-1">
              {pendingPayments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Revenue Collected</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rest of the existing code (Filters and Payments List) remains the same... */}
      {/* Filters */}
      {allPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by tenant, property, or location..."
            />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          <FilterDropdown
            label="Property"
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={[
              { value: 'all', label: 'All Properties' },
              ...(properties?.map(p => ({ value: p.name, label: p.name })) || []),
            ]}
          />
        </div>
      )}

      {/* Payments List */}
      {allPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No payments yet
            </h3>
            <p className="text-[#98989d]">
              Payment records will appear here once tenants are assigned
            </p>
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No payments found matching your filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setPropertyFilter('all')
              }}
              className="text-[#667eea] hover:underline"
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {filteredPayments.length} {filteredPayments.length === 1 ? 'Payment' : 'Payments'}
              </h2>
              {(searchQuery || statusFilter !== 'all' || propertyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setPropertyFilter('all')
                  }}
                  className="text-sm text-[#667eea] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                          {statusIcons[payment.status]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{payment.tenant_email}</h3>
                          <p className="text-sm text-[#98989d]">
                            {payment.property_name} - Unit {payment.unit_number}, Room {payment.room_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-[#636366]">Amount</p>
                          <p className="font-semibold text-white">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#636366]">Due Date</p>
                          <p className="text-[#98989d]">{formatDate(payment.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-[#636366]">Method</p>
                          <p className="text-[#98989d] capitalize">{payment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-[#636366]">Status</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs border ${statusColors[payment.status]}`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex items-end">
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaidMutation.mutate(payment.id)}
                              disabled={markAsPaidMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Paid
                            </Button>
                          )}
                          {payment.status === 'paid' && payment.created_at && (
                            <div>
                              <p className="text-[#636366] text-xs">Paid on</p>
                              <p className="text-[#98989d] text-sm">{formatDate(payment.created_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
