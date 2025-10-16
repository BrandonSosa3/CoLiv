import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/lib/api/tenants'
import { propertiesApi } from '@/lib/api/properties'
import { roomsApi } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button'
import { X, UserPlus } from 'lucide-react'

interface CreateTenantModalProps {
  onClose: () => void
}

interface FormData {
  email: string
  password: string
  property_id: string
  room_id: string
  lease_start: string
  lease_end: string
  rent_amount: number
  deposit_paid: number
}

export function CreateTenantModal({ onClose }: CreateTenantModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const selectedPropertyId = watch('property_id')

  const { data: rooms } = useQuery({
    queryKey: ['property-rooms', selectedPropertyId],
    queryFn: () => roomsApi.getByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  const availableRooms = rooms?.filter(r => r.status === 'available')

  const createMutation = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] })
      toast.success('Tenant created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create tenant')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      email: data.email,
      password: data.password,
      room_id: data.room_id,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      rent_amount: data.rent_amount,
      deposit_paid: data.deposit_paid || 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <UserPlus className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Add New Tenant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Email *
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#ff453a]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Password *
              </label>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: 8 })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-[#ff453a]">
                  {errors.password.type === 'minLength' ? 'Min 8 characters' : errors.password.message}
                </p>
              )}
            </div>
          </div>

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
              <p className="mt-1 text-xs text-[#ff453a]">{errors.property_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Room *
            </label>
            <select
              {...register('room_id', { required: 'Room is required' })}
              disabled={!selectedPropertyId}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select room...</option>
              {availableRooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  Unit {room.unit_number} - Room {room.room_number} (${room.rent_amount}/mo)
                </option>
              ))}
            </select>
            {errors.room_id && (
              <p className="mt-1 text-xs text-[#ff453a]">{errors.room_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Lease Start *
              </label>
              <input
                type="date"
                {...register('lease_start', { required: 'Lease start is required' })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Lease End *
              </label>
              <input
                type="date"
                {...register('lease_end', { required: 'Lease end is required' })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('rent_amount', { required: 'Rent amount is required', min: 0 })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Deposit Paid
              </label>
              <input
                type="number"
                step="0.01"
                {...register('deposit_paid', { min: 0 })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>
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
              {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
