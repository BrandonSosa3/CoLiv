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
import { DollarSign, Calendar, ChevronRight, User, Plus } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { TenantPaymentSummary } from '@/types'
import { TenantPaymentModal } from '@/components/tenants/TenantPaymentModal'
import { CustomPaymentRequestModal } from '@/components/payments/CustomPaymentRequestModal'

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showCustomPaymentModal, setShowCustomPaymentModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantPaymentSummary | null>(null)

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

  if (paymentsQuery.isLoading) {
    return <LoadingScreen message="Loading payments..." />
  }

  const allPayments = paymentsQuery.data || []

  // Group payments by tenant
  const tenantSummaries: TenantPaymentSummary[] = []
  const tenantMap = new Map()

  allPayments.forEach(payment => {
    const key = payment.tenant_email
    if (!tenantMap.has(key)) {
      tenantMap.set(key, {
        tenant: {
          id: payment.tenant_id,
          name: `${payment.tenant_first_name || ''} ${payment.tenant_last_name || ''}`.trim() || payment.tenant_email,
          email: payment.tenant_email,
          property: payment.property_name,
          unit: payment.unit_number,
          room: payment.room_number
        },
        payments: {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          totalAmount: 0,
          paidAmount: 0
        },
        allPayments: []
      })
    }

    const summary = tenantMap.get(key)
    summary.allPayments.push({
      ...payment,
      paid_date: payment.paid_date, // Use the existing paid_date field
    })
    summary.payments.total++
    summary.payments.totalAmount += Number(payment.amount)

    if (payment.status === 'paid') {
      summary.payments.paid++
      summary.payments.paidAmount += Number(payment.amount)
    } else if (payment.status === 'pending') {
      summary.payments.pending++
    } else if (payment.status === 'overdue') {
      summary.payments.overdue++
    }

    // Find next due payment
    if (payment.status === 'pending' && (!summary.payments.nextDueDate || payment.due_date < summary.payments.nextDueDate)) {
      summary.payments.nextDueDate = payment.due_date
      summary.payments.nextDueAmount = Number(payment.amount)
    }
  })

  tenantMap.forEach(summary => tenantSummaries.push(summary))

  // Apply filters to tenant summaries
  const filteredTenants = tenantSummaries.filter(summary => {
    if (statusFilter === 'has-pending' && summary.payments.pending === 0) return false
    if (statusFilter === 'has-overdue' && summary.payments.overdue === 0) return false
    if (statusFilter === 'all-paid' && summary.payments.pending > 0) return false
    if (propertyFilter !== 'all' && summary.tenant.property !== propertyFilter) return false

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        summary.tenant.name.toLowerCase().includes(searchLower) ||
        summary.tenant.email.toLowerCase().includes(searchLower) ||
        summary.tenant.property.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const totalPayments = tenantSummaries.reduce((sum, t) => sum + t.payments.total, 0)
  const totalPaid = tenantSummaries.reduce((sum, t) => sum + t.payments.paid, 0)
  const totalPending = tenantSummaries.reduce((sum, t) => sum + t.payments.pending, 0)
  const totalRevenue = tenantSummaries.reduce((sum, t) => sum + t.payments.paidAmount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-[#98989d] mt-2">
            Track rent payments by tenant across all properties
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCustomPaymentModal(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payment Request
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
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
            </div>
            <div className="p-6">
              <p className="text-[#98989d] mb-6">
                This will create payment records for all active tenants for their entire lease period.
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
            <p className="text-2xl font-bold text-white mt-1">{totalPayments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Paid</p>
            <p className="text-2xl font-bold text-white mt-1">{totalPaid}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Pending</p>
            <p className="text-2xl font-bold text-white mt-1">{totalPending}</p>
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

      {/* Filters */}
      {tenantSummaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by tenant name, email, or property..."
            />
          </div>
          <FilterDropdown
            label="Payment Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Tenants' },
              { value: 'has-pending', label: 'Has Pending Payments' },
              { value: 'has-overdue', label: 'Has Overdue Payments' },
              { value: 'all-paid', label: 'All Payments Current' },
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

      {/* Tenant List */}
      {tenantSummaries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No payments yet</h3>
            <p className="text-[#98989d]">Payment records will appear here once tenants are assigned</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">
              {filteredTenants.length} {filteredTenants.length === 1 ? 'Tenant' : 'Tenants'}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTenants.map((summary) => (
                <div
                  key={summary.tenant.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors cursor-pointer"
                  onClick={() => setSelectedTenant(summary)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                        <User className="w-5 h-5 text-[#667eea]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{summary.tenant.name}</h3>
                        <p className="text-sm text-[#98989d]">
                          {summary.tenant.property} - Unit {summary.tenant.unit}, Room {summary.tenant.room}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-[#32d74b] font-semibold">{summary.payments.paid}</p>
                          <p className="text-[#636366]">Paid</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#ffd60a] font-semibold">{summary.payments.pending}</p>
                          <p className="text-[#636366]">Pending</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#ff453a] font-semibold">{summary.payments.overdue}</p>
                          <p className="text-[#636366]">Overdue</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatCurrency(summary.payments.paidAmount)} / {formatCurrency(summary.payments.totalAmount)}
                        </p>
                        {summary.payments.nextDueDate && summary.payments.nextDueAmount !== undefined && (
                          <p className="text-sm text-[#98989d]">
                            Next: {formatCurrency(summary.payments.nextDueAmount)} due {formatDate(summary.payments.nextDueDate)}
                          </p>
                        )}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-[#636366]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <TenantPaymentModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onPaymentUpdate={markAsPaidMutation.mutate}
        />
      )}

      {/* Custom Payment Request Modal */}
      <CustomPaymentRequestModal
        isOpen={showCustomPaymentModal}
        onClose={() => setShowCustomPaymentModal(false)}
      />
    </div>
  )
}
