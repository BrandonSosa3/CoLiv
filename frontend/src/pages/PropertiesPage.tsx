import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { propertiesApi } from '@/lib/api/properties'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingScreen } from '@/components/ui/Spinner'
import { CreatePropertyModal } from '@/components/properties/CreatePropertyModal'
import { Building2, MapPin, Plus, ArrowRight } from 'lucide-react'

export function PropertiesPage() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  if (isLoading) {
    return <LoadingScreen message="Loading properties..." />
  }

  // Filter properties based on search
  const filteredProperties = properties?.filter((property) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      property.name.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Properties</h1>
          <p className="text-[#98989d] mt-2">
            Manage your co-living properties
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search Bar */}
      {properties && properties.length > 0 && (
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search properties by name, city, or address..."
          />
        </div>
      )}

      {properties?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No properties yet
            </h3>
            <p className="text-[#98989d] mb-6 max-w-sm mx-auto">
              Get started by creating your first property. You'll be able to add units and rooms with individual pricing.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Property
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredProperties && filteredProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
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

                <div className="flex items-center gap-2 text-sm text-[#98989d]">
                  <MapPin className="w-4 h-4" />
                  <span>{property.city}, {property.state}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
                  <div className="text-sm text-[#636366]">
                    {property.address}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredProperties && filteredProperties.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d]">
              No properties found matching "{searchQuery}"
            </p>
            <Button
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreatePropertyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
