import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { maintenanceApi } from '@/lib/api/maintenance'
import { propertiesApi } from '@/lib/api/properties'
import { unitsApi } from '@/lib/api/units'
import { roomsApi } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button'
import { X, Wrench } from 'lucide-react'

interface CreateMaintenanceModalProps {
  onClose: () => void
}

interface FormData {
  property_id: string
  unit_id: string
  room_id: string
  title: string
  description: string
  priority: string
}

export function CreateMaintenanceModal({ onClose }: CreateMaintenanceModalProps) {
  const queryClient = useQueryClient()
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>()

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const { data: units } = useQuery({
    queryKey: ['units', selectedPropertyId],
    queryFn: () => unitsApi.getByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  const { data: rooms } = useQuery({
    queryKey: ['rooms', selectedUnitId],
    queryFn: () => roomsApi.getByUnit(selectedUnitId),
    enabled: !!selectedUnitId,
  })

  const createMutation = useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-maintenance'] })
      toast.success('Maintenance request created')
      onClose()
    },
    onError: (error: any) => {
      console.error('Error creating maintenance request:', error)
      toast.error(error.response?.data?.detail || 'Failed to create request')
    },
  })

  const onSubmit = (data: FormData) => {
    console.log('Submitting maintenance request:', data)
    createMutation.mutate({
      property_id: data.property_id,
      unit_id: data.unit_id,
      room_id: data.room_id || null,
      title: data.title,
      description: data.description,
      priority: data.priority,
    })
  }

  const watchPropertyId = watch('property_id')
  const watchUnitId = watch('unit_id')

  // Update selected IDs when form changes
  if (watchPropertyId !== selectedPropertyId) {
    setSelectedPropertyId(watchPropertyId)
    setSelectedUnitId('')
  }
  if (watchUnitId !== selectedUnitId) {
    setSelectedUnitId(watchUnitId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Wrench className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Maintenance Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Property *
            </label>
            <select
              {...register('property_id', { required: 'Property is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="">Select property...</option>
              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {errors.property_id && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.property_id.message}</p>
            )}
          </div>

          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Unit *
            </label>
            <select
              {...register('unit_id', { required: 'Unit is required' })}
              disabled={!selectedPropertyId}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select unit...</option>
              {units?.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unit_number}
                </option>
              ))}
            </select>
            {errors.unit_id && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.unit_id.message}</p>
            )}
          </div>

          {/* Room Selection - Optional */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Room (Optional)
            </label>
            <select
              {...register('room_id')}
              disabled={!selectedUnitId}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select room (optional)...</option>
              {rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Leaky faucet in bathroom"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.description.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Priority *
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="low">Low - Can wait a week</option>
              <option value="medium">Medium - Fix within a few days</option>
              <option value="high">High - Fix within 24 hours</option>
              <option value="urgent">Urgent - Fix immediately</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.priority.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
