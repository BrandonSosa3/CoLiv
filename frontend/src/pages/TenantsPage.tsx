import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { propertiesApi } from '@/lib/api/properties'
import { tenantsApi } from '@/lib/api/tenants'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { Users, Mail, Home, Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const tenantQueries = useQuery({
    queryKey: ['all-tenants', properties?.map(p => p.id)],
    queryFn: async () => {
      if (!properties) return []
      const tenantsPromises = properties.map(p => tenantsApi.getByProperty(p.id))
      const tenantsArrays = await Promise.all(tenantsPromises)
      return tenantsArrays.flat()
    },
    enabled: !!properties,
  })

  const allTenants = tenantQueries.data || []

  // Apply filters
  const filteredTenants = allTenants.filter((tenant) => {
    // Status filter
    if (statusFilter !== 'all' && tenant.status !== statusFilter) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        tenant.email.toLowerCase().includes(searchLower) ||
        tenant.property_name.toLowerCase().includes(searchLower) ||
        tenant.unit_number.toLowerCase().includes(searchLower) ||
        tenant.room_number.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const activeTenants = allTenants.filter(t => t.status === 'active')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Tenants</h1>
        <p className="text-[#98989d] mt-2">
          Manage all tenants across your properties
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Tenants</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allTenants.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Active Tenants</p>
            <p className="text-2xl font-bold text-white mt-1">
              {activeTenants.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(
                activeTenants.reduce((sum, t) => sum + Number(t.rent_amount), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      {allTenants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by email, property, unit, or room..."
            />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'moved_out', label: 'Moved Out' },
            ]}
          />
        </div>
      )}

      {/* Tenants List */}
      {allTenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No tenants yet
            </h3>
            <p className="text-[#98989d]">
              Assign tenants to rooms from the property detail pages
            </p>
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No tenants found matching your search
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
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
                {filteredTenants.length} {filteredTenants.length === 1 ? 'Tenant' : 'Tenants'}
              </h2>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
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
              {filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                          <Users className="w-5 h-5 text-[#667eea]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{tenant.email}</h3>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                            tenant.status === 'active'
                              ? 'bg-[#32d74b]/10 text-[#32d74b] border border-[#32d74b]/20'
                              : 'bg-[#636366]/10 text-[#636366] border border-[#636366]/20'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-[#98989d]">
                          <Home className="w-4 h-4" />
                          <span>{tenant.property_name}</span>
                        </div>
                        <div className="text-[#98989d]">
                          Unit {tenant.unit_number}, Room {tenant.room_number}
                        </div>
                        <div className="flex items-center gap-2 text-[#98989d]">
                          <Calendar className="w-4 h-4" />
                          <span>Ends {formatDate(tenant.lease_end)}</span>
                        </div>
                        <div className="font-semibold text-white">
                          {formatCurrency(Number(tenant.rent_amount))}/mo
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
