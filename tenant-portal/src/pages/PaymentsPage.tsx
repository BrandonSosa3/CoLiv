import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api/payments'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { DollarSign, CheckCircle, Clock, AlertCircle, Calendar, FileText, Tag } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentsApi.getMyPayments,
  })

  if (isLoading) {
    return <LoadingScreen message="Loading payments..." />
  }

  const paymentsData = payments || []
  
  // Calculate payment summary
  const paidPayments = paymentsData.filter(p => p.status === 'paid')
  const pendingPayments = paymentsData.filter(p => p.status === 'pending')
  const overduePayments = paymentsData.filter(p => p.status === 'overdue')
  
  // Find next payment due
  const nextPayment = pendingPayments
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

  const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-[#98989d] mt-1">
          View your payment history and upcoming due dates
        </p>
      </div>

      {/* Next Payment Alert */}
      {overduePayments.length > 0 ? (
        <Card className="border-[#ff453a]/50 bg-[#ff453a]/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-[#ff453a]/20">
                <AlertCircle className="w-6 h-6 text-[#ff453a]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#ff453a]">
                  {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? 's' : ''}
                </h3>
                <p className="text-[#98989d] mt-1">
                  Please contact your property manager immediately to resolve overdue payments
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {overduePayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="px-3 py-1 bg-[#ff453a]/20 rounded-full">
                      <span className="text-sm text-[#ff453a] font-medium">
                        {formatCurrency(Number(payment.amount))} - Due {formatDate(payment.due_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : nextPayment ? (
        <Card className="border-[#ffd60a]/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-[#ffd60a]" />
              <div>
                <h3 className="text-lg font-semibold text-white">Next Payment Due</h3>
                <p className="text-2xl font-bold text-[#ffd60a] mt-1">
                  {formatCurrency(Number(nextPayment.amount))}
                </p>
                <p className="text-[#98989d]">
                  Due on {formatDate(nextPayment.due_date)}
                </p>
                {nextPayment.payment_type && nextPayment.payment_type !== 'rent' && (
                  <div className="mt-2">
                    {getPaymentTypeBadge(nextPayment.payment_type)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#32d74b]/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#32d74b]" />
              <div>
                <h3 className="text-lg font-semibold text-[#32d74b]">All Payments Current</h3>
                <p className="text-[#98989d]">You have no outstanding payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#32d74b]/20">
                <CheckCircle className="w-5 h-5 text-[#32d74b]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Paid</p>
                <p className="text-xl font-bold text-white">{paidPayments.length}</p>
                <p className="text-sm text-[#32d74b]">{formatCurrency(totalPaid)}</p>
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
                <p className="text-xl font-bold text-white">{pendingPayments.length}</p>
                <p className="text-sm text-[#ffd60a]">{formatCurrency(totalPending)}</p>
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
                <p className="text-xl font-bold text-white">{paymentsData.length}</p>
                <p className="text-sm text-[#667eea]">{formatCurrency(totalPaid + totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
        </CardHeader>
        <CardContent>
          {paymentsData.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-[#636366]" />
              <p className="text-[#98989d]">No payments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentsData.map((payment) => (
                <div
                  key={payment.id}
                  className={`p-4 rounded-lg border transition-all ${
                    payment.status === 'overdue'
                      ? 'bg-[#ff453a]/5 border-[#ff453a]/50 shadow-lg shadow-[#ff453a]/10'
                      : 'bg-[#141414] border-[#2c2c2e]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        payment.status === 'overdue'
                          ? 'bg-[#ff453a]/20'
                          : 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20'
                      }`}>
                        {statusIcons[payment.status]}
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
                          {payment.status === 'overdue' && (
                            <span className="ml-2 font-semibold">⚠ OVERDUE</span>
                          )}
                        </p>
                        {payment.paid_date && (
                          <p className="text-sm text-[#32d74b]">
                            Paid: {formatDate(payment.paid_date)}
                          </p>
                        )}
                        {payment.description && payment.payment_type !== 'rent' && (
                          <div className="mt-2 flex items-start gap-2 p-2 bg-[#1c1c1e] rounded border border-[#2c2c2e]">
                            <FileText className="w-4 h-4 text-[#98989d] mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-[#98989d]">{payment.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${statusColors[payment.status]}`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
