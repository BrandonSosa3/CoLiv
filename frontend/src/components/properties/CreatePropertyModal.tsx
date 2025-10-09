import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api/properties'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface PropertyForm {
  name: string
  address: string
  city: string
  state: string
  zip: string
  house_rules?: string
}

interface CreatePropertyModalProps {
  onClose: () => void
}

export function CreatePropertyModal({ onClose }: CreatePropertyModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyForm>()

  const createMutation = useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success(`Property "${data.name}" created successfully!`)
      onClose()
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || 'Failed to create property'
      setError(errorMsg)
      toast.error(errorMsg)
    },
  })

  const onSubmit = (data: PropertyForm) => {
    setError('')
    createMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <h2 className="text-xl font-semibold text-white">Create Property</h2>
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
            label="Property Name"
            placeholder="Downtown Loft"
            {...register('name', { required: 'Property name is required' })}
            error={errors.name?.message}
          />

          <Input
            label="Street Address"
            placeholder="123 Main Street"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="San Diego"
              {...register('city', { required: 'City is required' })}
              error={errors.city?.message}
            />

            <Input
              label="State"
              placeholder="CA"
              {...register('state', { required: 'State is required' })}
              error={errors.state?.message}
            />
          </div>

          <Input
            label="ZIP Code"
            placeholder="92101"
            {...register('zip', { required: 'ZIP is required' })}
            error={errors.zip?.message}
          />

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              House Rules (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="No smoking, quiet hours 10pm-8am..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              {...register('house_rules')}
            />
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
              {createMutation.isPending ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
