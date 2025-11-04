import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { roomsApi } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button'
import { X, DoorOpen } from 'lucide-react'

interface CreateRoomModalProps {
  unitId: string
  onClose: () => void
}

type RoomStatus = "vacant" | "occupied" | "maintenance"

interface RoomFormData {
  room_number: string
  rent_amount: number
  size_sqft?: number
  has_private_bath?: boolean
  status?: RoomStatus
  room_type?: 'private' | 'shared'
}

export function CreateRoomModal({ unitId, onClose }: CreateRoomModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<RoomFormData>({
    defaultValues: {
      has_private_bath: false,
      status: "vacant",
      room_type: "private",
    },
  })

  const createMutation = useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      toast.success('Room created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create room')
    },
  })

  const onSubmit = (data: RoomFormData) => {
    console.log('Form data before processing:', data) // Debug log
    
    const processedData = {
      unit_id: unitId,
      room_number: data.room_number,
      rent_amount: Number(data.rent_amount),
      size_sqft: data.size_sqft ? Number(data.size_sqft) : undefined, // Use undefined instead of null
      has_private_bath: data.has_private_bath ?? false,
      status: "vacant" as const,
      room_type: data.room_type ?? "private",
    }
    
    console.log('Processed data being sent:', processedData) // Debug log
    createMutation.mutate(processedData)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <DoorOpen className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Room</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Room Number *
            </label>
            <input
              type="text"
              {...register('room_number', { required: 'Room number is required' })}
              placeholder="e.g., A, B, 101"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.room_number && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.room_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Monthly Rent *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]">$</span>
              <input
                type="number"
                step="0.01"
                {...register('rent_amount', { 
                  required: 'Rent amount is required',
                  min: { value: 0, message: 'Rent must be positive' }
                })}
                placeholder="800.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              />
            </div>
            {errors.rent_amount && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.rent_amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Size (sq ft) <span className="text-[#636366]">(optional)</span>
            </label>
            <input
              type="number"
              {...register('size_sqft')}
              placeholder="120"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private_bath"
              {...register('has_private_bath')}
              className="w-4 h-4 rounded border-[#2c2c2e] bg-[#141414] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
            />
            <label htmlFor="private_bath" className="text-sm text-[#98989d]">
              Has private bathroom
            </label>
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