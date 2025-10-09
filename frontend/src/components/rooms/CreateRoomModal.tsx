import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { roomsApi } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface RoomForm {
  room_number: string
  room_type: 'private' | 'shared'
  size_sqft: string
  has_private_bath: boolean
  rent_amount: string
  status: 'vacant' | 'occupied' | 'maintenance'
}

interface CreateRoomModalProps {
  unitId: string
  onClose: () => void
}

export function CreateRoomModal({ unitId, onClose }: CreateRoomModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')

  const { register, handleSubmit, formState: { errors } } = useForm<RoomForm>({
    defaultValues: {
      room_type: 'private',
      has_private_bath: false,
      status: 'vacant',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: RoomForm) =>
      roomsApi.create({
        unit_id: unitId,
        room_number: data.room_number,
        room_type: data.room_type,
        size_sqft: data.size_sqft ? Number(data.size_sqft) : undefined,
        has_private_bath: data.has_private_bath,
        rent_amount: Number(data.rent_amount),
        status: data.status,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      toast.success(`Room ${data.room_number} created successfully!`)
      onClose()
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || 'Failed to create room'
      setError(errorMsg)
      toast.error(errorMsg)
    },
  })

  const onSubmit = (data: RoomForm) => {
    setError('')
    createMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <h2 className="text-xl font-semibold text-white">Add Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/20">
              <p className="text-sm text-[#ff453a]">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Number"
              placeholder="A"
              {...register('room_number', { required: 'Required' })}
              error={errors.room_number?.message}
            />

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Room Type
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                {...register('room_type')}
              >
                <option value="private">Private</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rent Amount"
              type="number"
              placeholder="900"
              {...register('rent_amount', { required: 'Required' })}
              error={errors.rent_amount?.message}
            />

            <Input
              label="Size (sq ft)"
              type="number"
              placeholder="150"
              {...register('size_sqft')}
              error={errors.size_sqft?.message}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has_private_bath"
              className="w-4 h-4 rounded bg-[#141414] border-[#2c2c2e] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
              {...register('has_private_bath')}
            />
            <label htmlFor="has_private_bath" className="text-sm text-[#98989d]">
              Has private bathroom
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Status
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              {...register('status')}
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
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
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
