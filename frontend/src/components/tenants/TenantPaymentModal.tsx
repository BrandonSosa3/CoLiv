import { useState, ReactElement } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { X, CheckCircle, Clock, AlertCircle, DollarSign, FileText, Tag, Edit } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { TenantPaymentSummary } from '@/types'
import { EditPaymentModal } from '@/components/payments/EditPaymentModal'

interface TenantPaymentModalProps {
  tenant: TenantPaymentSummary
  onClose: () => void
  onPaymentUpdate: (paymentId: string) => void
}

export function TenantPaymentModal({ tenant, onClose, onPaymentUpdate }: TenantPaymentModalProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingPayment, setEditingPayment] = useState<any>(null)

  // Sort payments by due date (newest first)
  const sortedPayments = [...tenant.allPayments].sort((a, b) => 
    new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  )

  // Apply status filter
  const filteredPayments = sortedPayments.filter(payment => {
    if (statusFilter === 'all') return true
    return payment.status === statusFilter
  })

  type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed'

  const statusIcons: Record<PaymentStatus, ReactElement> = {
    paid: <CheckCircle className="w-4 h-4 text-[#32d74b]" />,
    pending: <Clock className="w-4 h-4 text-[#ffd60a]" />,
    overdue: <AlertCircle className="w-4 h-4 text-[#ff453a]" />,
    failed: <AlertCircle className="w-4 h-4 text-[#ff453a]" />,
  }

  const statusColors: Record<PaymentStatus, string> = {
    paid: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    pending: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    overdue: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
    failed: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rent': 'Rent',
      'insurance': 'Insurance',
      'service_fee': 'Service Fee',
      'utilities': 'Utilities',
      'maintenance': 'Maintenance',
      'parking': 'Parking Fee',
      'pet_fee': 'Pet Fee',
      'late_fee': 'Late Fee',
      'custom': 'Custom',
    }
    return labels[type] || type
  }

  const getPaymentTypeBadge = (type: string) => {
    const isRent = type === 'rent'
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
        isRent 
          ? 'bg-[#0a84ff]/10 text-[#0a84ff] border-[#0a84ff]/20'
          : 'bg-[#bf5af2]/10 text-[#bf5af2] border-[#bf5af2]/20'
      }`}>
        <Tag className="w-3 h-3" />
        {getPaymentTypeLabel(type)}
      </span>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[90vh] bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
            <div>
              <h2 className="text-2xl font-semibold text-white">{tenant.tenant.name}</h2>
              <p className="text-[#98989d] mt-1">
                {tenant.tenant.property} - Unit {tenant.tenant.unit}, Room {tenant.tenant.room}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
            >
              <X className="w-5 h-5 text-[#98989d]" />
            </button>
          </div>

          {/* Payment Summary */}
          <div className="p-6 border-b border-[#2c2c2e]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#32d74b]/20">
                      <CheckCircle className="w-5 h-5 text-[#32d74b]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#98989d]">Paid</p>
                      <p className="text-xl font-bold text-white">{tenant.payments.paid}</p>
                      <p className="text-sm text-[#32d74b]">{formatCurrency(tenant.payments.paidAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#ffd60a]/20">
                      <Clock className="w-5 h-5 text-[#ffd60a]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#98989d]">Pending</p>
                      <p className="text-xl font-bold text-white">{tenant.payments.pending}</p>
                      <p className="text-sm text-[#ffd60a]">
                        {formatCurrency(tenant.payments.totalAmount - tenant.payments.paidAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#ff453a]/20">
                      <AlertCircle className="w-5 h-5 text-[#ff453a]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#98989d]">Overdue</p>
                      <p className="text-xl font-bold text-white">{tenant.payments.overdue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#667eea]/20">
                      <DollarSign className="w-5 h-5 text-[#667eea]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#98989d]">Total</p>
                      <p className="text-xl font-bold text-white">{tenant.payments.total}</p>
                      <p className="text-sm text-[#667eea]">{formatCurrency(tenant.payments.totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment List */}
          <div className="flex-1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Payment History</h3>
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Payments' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'overdue', label: 'Overdue' },
                  ]}
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-4 rounded-lg bg-[#141414] border transition-colors ${
                      payment.status === 'overdue' 
                        ? 'border-[#ff453a]/50 shadow-lg shadow-[#ff453a]/10' 
                        : 'border-[#2c2c2e]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          payment.status === 'overdue'
                            ? 'bg-[#ff453a]/20'
                            : 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20'
                        }`}>
                          {statusIcons[payment.status as PaymentStatus]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold ${
                              payment.status === 'overdue' ? 'text-[#ff453a]' : 'text-white'
                            }`}>
                              {formatCurrency(Number(payment.amount))}
                            </p>
                            {payment.payment_type && getPaymentTypeBadge(payment.payment_type)}
                          </div>
                          <p className={`text-sm ${
                            payment.status === 'overdue' ? 'text-[#ff453a]' : 'text-[#98989d]'
                          }`}>
                            Due: {formatDate(payment.due_date)}
                            {payment.status === 'overdue' && ' - OVERDUE'}
                          </p>
                          {payment.description && payment.payment_type !== 'rent' && (
                            <div className="mt-2 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-[#98989d] mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-[#98989d]">{payment.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[payment.status as PaymentStatus]}`}>
                          {payment.status}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingPayment(payment)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>

                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => onPaymentUpdate(payment.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Paid
                          </Button>
                        )}

                        {payment.status === 'paid' && payment.paid_date && (
                          <div className="text-right">
                            <p className="text-sm text-[#98989d]">Paid on</p>
                            <p className="text-sm text-white">{formatDate(payment.paid_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#2c2c2e]">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
      />
    </>
  )
}
