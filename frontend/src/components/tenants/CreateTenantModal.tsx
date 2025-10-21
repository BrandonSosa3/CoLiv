import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { tenantsApi } from '@/lib/api/tenants'
import { propertiesApi } from '@/lib/api/properties'
import { unitsApi } from '@/lib/api/units'
import { roomsApi } from '@/lib/api/rooms'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { X, User } from 'lucide-react'
import { Room, Unit } from '@/types'

interface CreateTenantModalProps {
  onClose: () => void
  preSelectedRoomId?: string
  preSelectedPropertyId?: string
}

interface FormData {
  email: string
  password: string
  property_id: string
  unit_id: string
  room_id: string
  lease_start: string
  lease_end: string
  rent_amount: string
}

export function CreateTenantModal({ onClose, preSelectedRoomId, preSelectedPropertyId }: CreateTenantModalProps) {
  const queryClient = useQueryClient()
  const [selectedPropertyId, setSelectedPropertyId] = useState(preSelectedPropertyId || '')
  const [selectedUnitId, setSelectedUnitId] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>()

  // Get all properties
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  // Get units for selected property
  const { data: units } = useQuery({
    queryKey: ['units', selectedPropertyId],
    queryFn: () => unitsApi.getByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  // Get rooms for selected unit
  const { data: rooms } = useQuery({
    queryKey: ['rooms', selectedUnitId],
    queryFn: () => roomsApi.getByUnit(selectedUnitId),
    enabled: !!selectedUnitId,
  })

  // Auto-select first property if available and no preselection
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id)
      setValue('property_id', properties[0].id)
    }
  }, [properties, selectedPropertyId, setValue])

  // Handle preselected room
  useEffect(() => {
    if (preSelectedRoomId && units) {
      // Find which unit contains the preselected room
      const unitWithRoom = units.find(unit => {
        // We'll need to check rooms for this unit
        // This will be handled when rooms data is available
      })
    }
  }, [preSelectedRoomId, units])

  // Set preselected room when rooms data is available
  useEffect(() => {
    if (preSelectedRoomId && rooms) {
      const preSelectedRoom = rooms.find(room => room.id === preSelectedRoomId)
      if (preSelectedRoom) {
        setValue('room_id', preSelectedRoomId)
        // Auto-fill rent amount from room
        setValue('rent_amount', preSelectedRoom.rent_amount.toString())
      }
    }
  }, [preSelectedRoomId, rooms, setValue])

  const createMutation = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      toast.success('Tenant created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create tenant')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      ...data,
      rent_amount: parseFloat(data.rent_amount),
    })
  }

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setValue('property_id', propertyId)
    setSelectedUnitId('')
    setValue('unit_id', '')
    setValue('room_id', '')
  }

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId)
    setValue('unit_id', unitId)
    setValue('room_id', '')
  }

  const availableRooms = rooms?.filter((r: Room) => r.status === 'vacant')

  // Helper to get unit number from unit_id
  const getUnitNumber = (unitId: string) => {
    return units?.find((u: Unit) => u.id === unitId)?.unit_number || ''
  }

  // Find unit for preselected room
  useEffect(() => {
    if (preSelectedRoomId && properties && units) {
      // Find the unit that contains this room
      const findUnitForRoom = async () => {
        for (const unit of units) {
          const unitRooms = await roomsApi.getByUnit(unit.id)
          if (unitRooms.find(room => room.id === preSelectedRoomId)) {
            setSelectedUnitId(unit.id)
            setValue('unit_id', unit.id)
            break
          }
        }
      }
      findUnitForRoom()
    }
  }, [preSelectedRoomId, units, setValue])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <User className="w-5 h-5 text-[#667eea]" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {preSelectedRoomId ? 'Add Tenant to Room' : 'Add New Tenant'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
            >
              <X className="w-5 h-5 text-[#98989d]" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Email *
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                placeholder="tenant@example.com"
              />
              {errors.email && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Password *
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Property *
              </label>
              <select
                {...register('property_id', { required: 'Property is required' })}
                onChange={(e) => handlePropertyChange(e.target.value)}
                value={selectedPropertyId}
                disabled={!!preSelectedPropertyId}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] disabled:opacity-50"
              >
                <option value="">Select a property</option>
                {properties?.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.property_id && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.property_id.message}</p>
              )}
            </div>

            {/* Unit Selection */}
            {selectedPropertyId && (
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Unit *
                </label>
                <select
                  {...register('unit_id', { required: 'Unit is required' })}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  value={selectedUnitId}
                  disabled={!!preSelectedRoomId}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] disabled:opacity-50"
                >
                  <option value="">Select a unit</option>
                  {units?.map((unit: Unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.unit_number}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.unit_id.message}</p>
                )}
              </div>
            )}

            {/* Room Selection */}
            {selectedUnitId && (
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Room *
                </label>
                <select
                  {...register('room_id', { required: 'Room is required' })}
                  disabled={!!preSelectedRoomId}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] disabled:opacity-50"
                >
                  <option value="">Select a room</option>
                  {availableRooms?.map((room: Room) => (
                    <option key={room.id} value={room.id}>
                      Unit {getUnitNumber(room.unit_id)} - Room {room.room_number} (${room.rent_amount}/mo)
                    </option>
                  ))}
                </select>
                {errors.room_id && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.room_id.message}</p>
                )}
                {availableRooms?.length === 0 && !preSelectedRoomId && (
                  <p className="text-[#ff9f0a] text-sm mt-1">
                    No vacant rooms available in this unit
                  </p>
                )}
              </div>
            )}

            {/* Lease Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Lease Start *
                </label>
                <input
                  type="date"
                  {...register('lease_start', { required: 'Lease start date is required' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
                {errors.lease_start && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.lease_start.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Lease End *
                </label>
                <input
                  type="date"
                  {...register('lease_end', { required: 'Lease end date is required' })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
                {errors.lease_end && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.lease_end.message}</p>
                )}
              </div>
            </div>

            {/* Rent Amount */}
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('rent_amount', { required: 'Rent amount is required' })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                placeholder="1000.00"
              />
              {errors.rent_amount && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.rent_amount.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
