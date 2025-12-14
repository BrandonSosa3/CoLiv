import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tenantsApi } from '@/lib/api/tenants'
import { propertiesApi } from '@/lib/api/properties'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { CreateTenantModal } from '@/components/tenants/CreateTenantModal'
import { RemoveTenantDialog } from '@/components/tenants/RemoveTenantDialog'
import { User, UserX, Sparkles, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { TenantWithUser } from '@/types'

export function TenantsPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithUser | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'moved_out'>('all')

  // Get all properties for the dropdown
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  // Auto-select first property if available
  if (properties && properties.length > 0 && !selectedPropertyId) {
    setSelectedPropertyId(properties[0].id)
  }

  const { data: allTenants, isLoading } = useQuery({
    queryKey: ['tenants', selectedPropertyId],
    queryFn: () => tenantsApi.getByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  // Filter tenants by status
  const tenants = allTenants?.filter(tenant => 
    statusFilter === 'all' ? true : tenant.status === statusFilter
  )

  if (isLoading) {
    return <LoadingScreen message="Loading tenants..." />
  }



  const handleRemoveTenant = (tenant: TenantWithUser) => {
    setSelectedTenant(tenant)
    setShowRemoveDialog(true)
  }

  const statusColors = {
    active: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    pending: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    moved_out: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
  }

  const activeTenantCount = allTenants?.filter(t => t.status === 'active').length || 0
  const movedOutCount = allTenants?.filter(t => t.status === 'moved_out').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenants</h1>
          <p className="text-[#98989d] mt-2">
            {activeTenantCount} active · {movedOutCount} moved out
          </p>
        </div>
        <div className="flex items-center gap-4">
          {properties && properties.length > 1 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            <User className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            statusFilter === 'all'
              ? 'bg-[#667eea] text-white'
              : 'bg-[#1c1c1e] text-[#98989d] hover:bg-[#2c2c2e]'
          }`}
        >
          All ({allTenants?.length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            statusFilter === 'active'
              ? 'bg-[#32d74b] text-white'
              : 'bg-[#1c1c1e] text-[#98989d] hover:bg-[#2c2c2e]'
          }`}
        >
          Active ({activeTenantCount})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            statusFilter === 'pending'
              ? 'bg-[#ffd60a] text-black'
              : 'bg-[#1c1c1e] text-[#98989d] hover:bg-[#2c2c2e]'
          }`}
        >
          Pending ({allTenants?.filter(t => t.status === 'pending').length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('moved_out')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            statusFilter === 'moved_out'
              ? 'bg-[#636366] text-white'
              : 'bg-[#1c1c1e] text-[#98989d] hover:bg-[#2c2c2e]'
          }`}
        >
          Moved Out ({movedOutCount})
        </button>
      </div>

      {!selectedPropertyId ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d]">
              Please select a property to view tenants
            </p>
          </CardContent>
        </Card>
      ) : tenants?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No tenants found with this status.
            </p>
            {statusFilter !== 'all' && (
              <Button variant="secondary" onClick={() => setStatusFilter('all')}>
                View All Tenants
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants?.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                      <User className="w-5 h-5 text-[#667eea]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {tenant.first_name && tenant.last_name 
                          ? `${tenant.first_name} ${tenant.last_name}`
                          : tenant.email.split('@')[0]
                        }
                      </h3>
                      <p className="text-sm text-[#98989d]">
                        {tenant.property_name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[tenant.status]}`}>
                    {tenant.status === 'moved_out' ? 'Moved Out' : tenant.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#636366]">Email</span>
                    <span className="text-white">{tenant.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#636366]">Unit</span>
                    <span className="text-white">{tenant.unit_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#636366]">Room</span>
                    <span className="text-white">{tenant.room_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#636366]">Rent</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(Number(tenant.rent_amount))}/mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#636366]">Lease</span>
                    <span className="text-white text-xs">
                      {new Date(tenant.lease_start).toLocaleDateString()} - {new Date(tenant.lease_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {tenant.status === 'active' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveTenant(tenant)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#2c2c2e]">
                    <p className="text-xs text-[#636366] text-center">
                      {tenant.status === 'moved_out' ? 'Historical Record' : 'Awaiting Move-in'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTenantModal onClose={() => setShowCreateModal(false)} />
      )}

      {showRemoveDialog && selectedTenant && (
        <RemoveTenantDialog
          tenantId={selectedTenant.id}
          tenantEmail={selectedTenant.email}
          roomNumber={selectedTenant.room_number}
          onClose={() => {
            setShowRemoveDialog(false)
            setSelectedTenant(null)
          }}
        />
      )}

          tenantId={selectedTenant.id}
          tenantEmail={selectedTenant.email}
          onClose={() => {
            setSelectedTenant(null)
          }}
        />
      )}

          tenantId={selectedTenant.id}
          tenantEmail={selectedTenant.email}
          onClose={() => {
            setSelectedTenant(null)
          }}
        />
      )}
    </div>
  )
}
