import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dashboardApi } from '@/lib/api/dashboard'
import { paymentsApi } from '@/lib/api/payments'
import { propertiesApi } from '@/lib/api/properties'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { TrendingUp, DollarSign, Users, Download, Percent } from 'lucide-react'

interface MonthData {
  month: string
  revenue: number
  count: number
  paid: number
  pending: number
  overdue: number
}

export function AnalyticsPage() {
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [timeRange, setTimeRange] = useState('6months')

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['operator-metrics'],
    queryFn: dashboardApi.getOperatorMetrics,
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const { data: allPayments } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      if (!properties) return []
      const paymentsPromises = properties.map(p => paymentsApi.getByProperty(p.id))
      const paymentsArrays = await Promise.all(paymentsPromises)
      return paymentsArrays.flat()
    },
    enabled: !!properties,
  })

  if (metricsLoading) {
    return <LoadingScreen message="Loading analytics..." />
  }

  // Filter data by selected property
  const filteredPayments = selectedProperty === 'all' 
    ? allPayments 
    : allPayments?.filter(p => p.property_name === selectedProperty)

  // Calculate revenue by month
  const revenueByMonth = calculateRevenueByMonth(filteredPayments || [], timeRange)
  
  // Calculate payment status distribution
  const paymentStatusData = [
    { name: 'Paid', value: filteredPayments?.filter(p => p.status === 'paid').length || 0, color: '#32d74b' },
    { name: 'Pending', value: filteredPayments?.filter(p => p.status === 'pending').length || 0, color: '#ffd60a' },
    { name: 'Overdue', value: filteredPayments?.filter(p => p.status === 'overdue').length || 0, color: '#ff453a' },
  ]

  // Calculate collection rate
  const totalPayments = filteredPayments?.length || 0
  const paidPayments = filteredPayments?.filter(p => p.status === 'paid').length || 0
  const collectionRate = totalPayments > 0 ? ((paidPayments / totalPayments) * 100).toFixed(1) : '0'

  // Calculate total revenue
  const totalRevenue = filteredPayments
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Calculate average revenue per room
  const totalRooms = metrics?.total_rooms || 1
  const avgRevenuePerRoom = totalRevenue / totalRooms

  // Calculate occupancy rate
  const occupancyRate = metrics?.occupied_rooms && metrics?.total_rooms
    ? ((metrics.occupied_rooms / metrics.total_rooms) * 100).toFixed(1)
    : '0'

  const handleExportCSV = () => {
    if (!filteredPayments) return

    const csv = [
      ['Date', 'Property', 'Tenant', 'Unit', 'Room', 'Amount', 'Status', 'Payment Method', 'Due Date', 'Paid Date'],
      ...filteredPayments.map(p => [
        new Date(p.due_date).toLocaleDateString(),
        p.property_name,
        p.tenant_email,
        p.unit_number,
        p.room_number,
        p.amount,
        p.status,
        p.payment_method || 'N/A',
        p.due_date,
        p.paid_date || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-[#98989d] mt-2">
            Revenue trends, occupancy metrics, and insights
          </p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FilterDropdown
          label="Property"
          value={selectedProperty}
          onChange={setSelectedProperty}
          options={[
            { value: 'all', label: 'All Properties' },
            ...(properties?.map(p => ({ value: p.name, label: p.name })) || []),
          ]}
        />
        <FilterDropdown
          label="Time Range"
          value={timeRange}
          onChange={setTimeRange}
          options={[
            { value: '3months', label: 'Last 3 Months' },
            { value: '6months', label: 'Last 6 Months' },
            { value: '12months', label: 'Last 12 Months' },
            { value: 'all', label: 'All Time' },
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-[#32d74b]" />
              <div>
                <p className="text-sm text-[#636366]">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Percent className="w-8 h-8 text-[#667eea]" />
              <div>
                <p className="text-sm text-[#636366]">Collection Rate</p>
                <p className="text-2xl font-bold text-white">{collectionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#ff9f0a]" />
              <div>
                <p className="text-sm text-[#636366]">Occupancy Rate</p>
                <p className="text-2xl font-bold text-white">
                  {occupancyRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#ffd60a]" />
              <div>
                <p className="text-sm text-[#636366]">Avg per Room</p>
                <p className="text-2xl font-bold text-white">
                  ${avgRevenuePerRoom.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Revenue Trend</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" />
              <XAxis 
                dataKey="month" 
                stroke="#98989d"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#98989d"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1c1c1e',
                  border: '1px solid #2c2c2e',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Legend 
                wrapperStyle={{ color: '#98989d' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Payment Status</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1c1c1e',
                    border: '1px solid #2c2c2e',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Payment Count */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Monthly Payment Volume</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" />
                <XAxis 
                  dataKey="month" 
                  stroke="#98989d"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#98989d"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1c1c1e',
                    border: '1px solid #2c2c2e',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value: any) => [value, 'Payments']}
                />
                <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Breakdown by Month */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Payment Status by Month</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" />
              <XAxis 
                dataKey="month" 
                stroke="#98989d"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#98989d"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1c1c1e',
                  border: '1px solid #2c2c2e',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#98989d' }}
              />
              <Bar dataKey="paid" stackId="a" fill="#32d74b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#ffd60a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="overdue" stackId="a" fill="#ff453a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to calculate revenue by month
function calculateRevenueByMonth(payments: any[], timeRange: string): MonthData[] {
  const now = new Date()
  const monthsToShow = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : timeRange === '12months' ? 12 : 24

  const months: MonthData[] = []
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: 0,
      count: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
    })
  }

  payments.forEach(payment => {
    const paymentDate = new Date(payment.due_date)
    const monthKey = paymentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    const monthData = months.find(m => m.month === monthKey)
    if (monthData) {
      monthData.count++
      
      if (payment.status === 'paid') {
        monthData.revenue += Number(payment.amount)
        monthData.paid++
      } else if (payment.status === 'pending') {
        monthData.pending++
      } else if (payment.status === 'overdue') {
        monthData.overdue++
      }
    }
  })

  return months
}
