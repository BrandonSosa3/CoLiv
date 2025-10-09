import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { dashboardApi } from '@/lib/api/dashboard'
import { propertiesApi } from '@/lib/api/properties'
import { Building2, Home, Users, DollarSign, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['operator-metrics'],
    queryFn: dashboardApi.getOperatorMetrics,
  })

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  if (metricsLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#98989d]">Loading dashboard...</div>
      </div>
    )
  }

  const occupancyRate = metrics?.total_rooms
    ? Math.round((metrics.occupied_rooms / metrics.total_rooms) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-[#98989d] mt-2">
            Overview of your co-living operations
          </p>
        </div>
        {properties && properties.length > 0 && (
          <Button onClick={() => navigate('/dashboard/properties')}>
            View All Properties
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#98989d]">Properties</p>
              <p className="text-2xl font-bold text-white mt-1">
                {metrics?.total_properties || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Building2 className="w-6 h-6 text-[#667eea]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#98989d]">Total Rooms</p>
              <p className="text-2xl font-bold text-white mt-1">
                {metrics?.total_rooms || 0}
              </p>
              <p className="text-xs text-[#636366] mt-1">
                {metrics?.occupied_rooms || 0} occupied
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Home className="w-6 h-6 text-[#667eea]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#98989d]">Occupancy Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {occupancyRate}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Users className="w-6 h-6 text-[#667eea]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#98989d]">Monthly Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(metrics?.total_revenue || 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <DollarSign className="w-6 h-6 text-[#667eea]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List or Empty State */}
      {properties?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Get Started with CoLiv OS
            </h3>
            <p className="text-[#98989d] mb-6 max-w-md mx-auto">
              Create your first property to start managing units and rooms with individual pricing. Room-level tracking makes co-living management simple.
            </p>
            <Button onClick={() => navigate('/dashboard/properties')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your Properties</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/properties')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties?.slice(0, 3).map((property) => (
              <Card
                key={property.id}
                className="group cursor-pointer hover:border-[#667eea] transition-colors"
                onClick={() => navigate(`/dashboard/properties/${property.id}`)}
              >
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                      <Building2 className="w-6 h-6 text-[#667eea]" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#636366] group-hover:text-[#667eea] group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    {property.name}
                  </h3>

                  <p className="text-sm text-[#98989d]">
                    {property.city}, {property.state}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard/properties')}
              className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#667eea] transition-colors text-left"
            >
              <Building2 className="w-5 h-5 text-[#667eea] mb-2" />
              <p className="text-sm font-medium text-white">Manage Properties</p>
              <p className="text-xs text-[#636366] mt-1">
                View and edit your properties
              </p>
            </button>

            <button
              onClick={() => navigate('/dashboard/tenants')}
              className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#667eea] transition-colors text-left"
            >
              <Users className="w-5 h-5 text-[#667eea] mb-2" />
              <p className="text-sm font-medium text-white">View Tenants</p>
              <p className="text-xs text-[#636366] mt-1">
                See all active tenants
              </p>
            </button>

            <button
              onClick={() => navigate('/dashboard/properties')}
              className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#667eea] transition-colors text-left"
            >
              <Home className="w-5 h-5 text-[#667eea] mb-2" />
              <p className="text-sm font-medium text-white">Add Rooms</p>
              <p className="text-xs text-[#636366] mt-1">
                Create rooms with individual pricing
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
