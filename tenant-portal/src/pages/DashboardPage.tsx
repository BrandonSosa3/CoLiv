import { useQuery } from '@tanstack/react-query'
import { tenantApi, paymentsApi } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Home, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export function DashboardPage() {
  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: ['tenant-lease'],
    queryFn: tenantApi.getLeaseInfo,
  })

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['tenant-payments'],
    queryFn: paymentsApi.getMyPayments,
  })



  if (leaseLoading || paymentsLoading) {
    return <LoadingScreen message="Loading your dashboard..." />
  }

  const pendingPayments = payments?.filter((p: any) => p.status === 'pending') || []
  const paidPayments = payments?.filter((p: any) => p.status === 'paid') || []
  const overduePayments = payments?.filter((p: any) => p.status === 'overdue') || []
  const nextPayment = pendingPayments?.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-[#98989d] mt-2">Welcome back!</p>
      </div>

      {/* Lease Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <Home className="w-5 h-5 text-[#667eea]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Your Room</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#636366]">Property</p>
                <p className="text-lg font-semibold text-white">{lease?.property_name}</p>
              </div>
              <div>
                <p className="text-sm text-[#636366]">Location</p>
                <p className="text-white">Unit {lease?.unit_number}, Room {lease?.room_number}</p>
              </div>
              <div>
                <p className="text-sm text-[#636366]">Monthly Rent</p>
                <p className="text-lg font-semibold text-[#667eea]">
                  ${Number(lease?.rent_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <Calendar className="w-5 h-5 text-[#667eea]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Lease Details</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#636366]">Lease Start</p>
                <p className="text-white">{new Date(lease?.lease_start).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-[#636366]">Lease End</p>
                <p className="text-white">{new Date(lease?.lease_end).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-[#636366]">Status</p>
                <span className="inline-block px-2 py-1 rounded text-sm bg-[#32d74b]/10 text-[#32d74b] border border-[#32d74b]/20">
                  {lease?.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-[#667eea]" />
              <div>
                <p className="text-sm text-[#636366]">Total Payments</p>
                <p className="text-2xl font-bold text-white">{payments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-[#32d74b]" />
              <div>
                <p className="text-sm text-[#636366]">Paid</p>
                <p className="text-2xl font-bold text-white">{paidPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#ffd60a]" />
              <div>
                <p className="text-sm text-[#636366]">Pending</p>
                <p className="text-2xl font-bold text-white">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {overduePayments.length > 0 ? (
          <Card className="border-[#ff453a]/20">
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ff453a]/20">
                  <AlertCircle className="w-5 h-5 text-[#ff453a]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#ff453a]">Overdue Payment</h3>
                  <p className="text-xl font-bold text-white mt-1">
                    {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-[#98989d]">Contact property manager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : nextPayment ? (
          <Card className="border-[#ffd60a]/20">
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ffd60a]/20">
                  <Calendar className="w-5 h-5 text-[#ffd60a]" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Next Payment Due</h3>
                  <p className="text-xl font-bold text-[#ffd60a] mt-1">
                    {formatCurrency(Number(nextPayment.amount))}
                  </p>
                  <p className="text-sm text-[#98989d]">
                    Due {formatDate(nextPayment.due_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#32d74b]/20">
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#32d74b]/20">
                  <CheckCircle className="w-5 h-5 text-[#32d74b]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#32d74b]">All Current</h3>
                  <p className="text-sm text-[#98989d] mt-1">No payments due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
