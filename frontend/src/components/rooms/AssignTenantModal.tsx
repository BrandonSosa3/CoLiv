import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/lib/api/tenants'
import { Button } from '@/components/ui/Button'
import { X, UserPlus } from 'lucide-react'

interface AssignTenantModalProps {
  roomId: string
  roomNumber: string
  rentAmount: number
  onClose: () => void
}

interface FormData {
  email: string
  password?: string
  lease_start: string
  lease_end: string
  deposit_paid?: number
}

export function AssignTenantModal({
  roomId,
  roomNumber,
  rentAmount,
  onClose,
}: AssignTenantModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      password: 'TempPassword123!',
    },
  })

  const createMutation = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['operator-metrics'] })
      toast.success('Tenant assigned successfully')
      onClose()
    },
    onError: (error: any) => {
      console.error('Error assigning tenant:', error)
      // Handle validation errors
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          const messages = detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ')
          toast.error(`Validation error: ${messages}`)
        } else if (typeof detail === 'string') {
          toast.error(detail)
        } else {
          toast.error('Failed to assign tenant')
        }
      } else {
        toast.error('Failed to assign tenant')
      }
    },
  })

  const onSubmit = (data: FormData) => {
    console.log('Submitting tenant data:', {
      room_id: roomId,
      email: data.email,
      password: data.password,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      rent_amount: rentAmount,
      deposit_paid: data.deposit_paid || 0,
    })

    createMutation.mutate({
      room_id: roomId,
      email: data.email,
      password: data.password,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      rent_amount: rentAmount,
      deposit_paid: data.deposit_paid || 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <UserPlus className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Assign Tenant to Room {roomNumber}
            </h2>
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
              Tenant Email *
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="tenant@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Temporary Password *
            </label>
            <input
              type="text"
              {...register('password', { required: 'Password is required' })}
              placeholder="TempPassword123!"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-[#636366]">
              Tenant will use this to login to the tenant portal
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Lease Start Date *
            </label>
            <input
              type="date"
              {...register('lease_start', { required: 'Lease start date is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.lease_start && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.lease_start.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Lease End Date *
            </label>
            <input
              type="date"
              {...register('lease_end', { required: 'Lease end date is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.lease_end && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.lease_end.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Monthly Rent
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]">$</span>
              <input
                type="text"
                value={rentAmount.toFixed(2)}
                disabled
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2c2c2e] text-[#636366] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Deposit Paid (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]">$</span>
              <input
                type="number"
                step="0.01"
                {...register('deposit_paid')}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
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
              {createMutation.isPending ? 'Assigning...' : 'Assign Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
