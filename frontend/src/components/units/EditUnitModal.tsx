import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unitsApi } from '@/lib/api/units'
import { Unit } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface UnitFormData {
  unit_number: string
  floor: string
  bedrooms: string
  bathrooms: string
  square_feet: string
  furnished: boolean
}

interface EditUnitModalProps {
  unit: Unit
  onClose: () => void
}

export function EditUnitModal({ unit, onClose }: EditUnitModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')

  const { register, handleSubmit, formState: { errors } } = useForm<UnitFormData>({
    defaultValues: {
      unit_number: unit.unit_number,
      floor: unit.floor?.toString() || '',
      bedrooms: unit.bedrooms.toString(),
      bathrooms: unit.bathrooms.toString(),
      square_feet: unit.square_feet?.toString() || '',
      furnished: unit.furnished,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UnitFormData) => {
      return unitsApi.update(unit.id, {
        unit_number: data.unit_number,
        floor: data.floor ? Number(data.floor) : undefined,
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        square_feet: data.square_feet ? Number(data.square_feet) : undefined,
        furnished: data.furnished,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units', unit.property_id] })
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      toast.success(`Unit ${data.unit_number} updated successfully!`)
      onClose()
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || 'Failed to update unit'
      setError(errorMsg)
      toast.error(errorMsg)
    },
  })

  const onSubmit = (data: UnitFormData) => {
    setError('')
    updateMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <h2 className="text-xl font-semibold text-white">Edit Unit</h2>
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
              label="Unit Number"
              placeholder="3B"
              error={errors.unit_number?.message}
              {...register('unit_number', { required: 'Unit number is required' })}
            />

            <Input
              label="Floor"
              type="number"
              placeholder="3"
              error={errors.floor?.message}
              {...register('floor')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bedrooms"
              type="number"
              placeholder="4"
              error={errors.bedrooms?.message}
              {...register('bedrooms', { required: 'Bedrooms is required' })}
            />

            <Input
              label="Bathrooms"
              type="number"
              placeholder="2"
              error={errors.bathrooms?.message}
              {...register('bathrooms', { required: 'Bathrooms is required' })}
            />
          </div>

          <Input
            label="Square Feet (Optional)"
            type="number"
            placeholder="1500"
            error={errors.square_feet?.message}
            {...register('square_feet')}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="furnished"
              className="w-4 h-4 rounded bg-[#141414] border-[#2c2c2e] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
              {...register('furnished')}
            />
            <label htmlFor="furnished" className="text-sm text-[#98989d]">
              Furnished
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
