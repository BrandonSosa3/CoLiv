import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/lib/api/tenants'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface AssignTenantForm {
  email: string
  password: string
  lease_start: string
  lease_end: string
  deposit_paid: string
}

interface AssignTenantModalProps {
  roomId: string
  roomNumber: string
  rentAmount: number
  onClose: () => void
}

export function AssignTenantModal({
  roomId,
  roomNumber,
  rentAmount,
  onClose,
}: AssignTenantModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')
  const { register, handleSubmit, formState: { errors } } = useForm<AssignTenantForm>()

  const assignMutation = useMutation({
    mutationFn: async (data: AssignTenantForm) => {
      const user = await authApi.signup({
        email: data.email,
        password: data.password,
        role: 'tenant',
      })

      return tenantsApi.create({
        user_id: user.id,
        room_id: roomId,
        lease_start: data.lease_start,
        lease_end: data.lease_end,
        rent_amount: rentAmount,
        deposit_paid: data.deposit_paid ? Number(data.deposit_paid) : undefined,
        status: 'active',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['operator-metrics'] })
      toast.success(`Tenant assigned to Room ${roomNumber}!`)
      onClose()
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || 'Failed to assign tenant'
      setError(errorMsg)
      toast.error(errorMsg)
    },
  })

  const onSubmit = (data: AssignTenantForm) => {
    setError('')
    assignMutation.mutate(data)
  }

  const today = new Date().toISOString().split('T')[0]
  const sixMonthsLater = new Date()
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
  const defaultLeaseEnd = sixMonthsLater.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div>
            <h2 className="text-xl font-semibold text-white">Assign Tenant</h2>
            <p className="text-sm text-[#98989d] mt-1">
              Room {roomNumber} - ${rentAmount}/mo
            </p>
          </div>
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

          <Input
            label="Tenant Email"
            type="email"
            placeholder="tenant@example.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="tenant123"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lease Start"
              type="date"
              defaultValue={today}
              {...register('lease_start', { required: 'Required' })}
              error={errors.lease_start?.message}
            />

            <Input
              label="Lease End"
              type="date"
              defaultValue={defaultLeaseEnd}
              {...register('lease_end', { required: 'Required' })}
              error={errors.lease_end?.message}
            />
          </div>

          <Input
            label="Deposit Paid (Optional)"
            type="number"
            placeholder={String(rentAmount * 2)}
            {...register('deposit_paid')}
            error={errors.deposit_paid?.message}
          />

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
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
