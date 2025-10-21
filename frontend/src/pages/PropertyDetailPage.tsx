import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { propertiesApi } from '@/lib/api/properties'
import { unitsApi } from '@/lib/api/units'
import { roomsApi } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { CreateUnitModal } from '@/components/units/CreateUnitModal'
import { EditPropertyModal } from '@/components/properties/EditPropertyModal'
import { UnitCard } from '@/components/units/UnitCard'
import { DeletePropertyDialog } from '@/components/properties/DeletePropertyDialog'
import { ArrowLeft, Plus, MapPin, Trash2, Edit2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showCreateUnit, setShowCreateUnit] = useState(false)
  const [showEditProperty, setShowEditProperty] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!),
    enabled: !!id,
  })

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', id],
    queryFn: () => unitsApi.getByProperty(id!),
    enabled: !!id,
  })

  const unitsWithRooms = useQuery({
    queryKey: ['units-with-rooms', units?.map(u => u.id)],
    queryFn: async () => {
      if (!units) return []
      const roomsPromises = units.map(unit => roomsApi.getByUnit(unit.id))
      const roomsArrays = await Promise.all(roomsPromises)
      return units.map((unit, index) => ({
        ...unit,
        rooms: roomsArrays[index],
      }))
    },
    enabled: !!units && units.length > 0,
  })

  if (propertyLoading || unitsLoading) {
    return <LoadingScreen message="Loading property..." />
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-[#98989d]">Property not found</p>
      </div>
    )
  }

  const allRooms = unitsWithRooms.data?.flatMap(u => u.rooms) || []
  const totalRooms = allRooms.length
  const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length
  const totalRevenue = allRooms
    .filter(r => r.status === 'occupied')
    .reduce((sum, r) => sum + Number(r.rent_amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/properties')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{property.name}</h1>
            <div className="flex items-center gap-2 text-[#98989d] mt-2">
              <MapPin className="w-4 h-4" />
              <span>
                {property.address}, {property.city}, {property.state} {property.zip}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowEditProperty(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button onClick={() => setShowCreateUnit(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Units</p>
            <p className="text-2xl font-bold text-white mt-1">
              {units?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Rooms</p>
            <p className="text-2xl font-bold text-white mt-1">
              {totalRooms}
            </p>
            <p className="text-sm text-[#98989d] mt-1">
              {occupiedRooms} occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-sm text-[#98989d] mt-1">
              {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}% occupancy
            </p>
          </CardContent>
        </Card>
      </div>

      {property.house_rules && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">House Rules</h2>
          </CardHeader>
          <CardContent>
            <p className="text-[#98989d] whitespace-pre-wrap">
              {property.house_rules}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Units & Rooms</h2>
        
        {units?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-[#98989d] mb-4">
                No units yet. Add your first unit to start managing rooms.
              </p>
              <Button onClick={() => setShowCreateUnit(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Unit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {unitsWithRooms.data?.map((unit) => (
              <UnitCard key={unit.id} unit={unit} rooms={unit.rooms} propertyId={id!} />
            ))}
          </div>
        )}
      </div>

      {showCreateUnit && (
        <CreateUnitModal
          propertyId={property.id}
          onClose={() => setShowCreateUnit(false)}
        />
      )}

      {showEditProperty && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditProperty(false)}
        />
      )}

      {showDeleteDialog && (
        <DeletePropertyDialog
          propertyId={property.id}
          propertyName={property.name}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={() => navigate('/dashboard/properties')}
        />
      )}
    </div>
  )
}
