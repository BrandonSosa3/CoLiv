import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { preferencesApi } from '@/lib/api/preferences'
import { Button } from '@/components/ui/Button'
import { X, Sparkles } from 'lucide-react'

interface SetPreferencesModalProps {
  tenantId: string
  tenantEmail: string
  onClose: () => void
}

interface FormData {
  cleanliness_importance: number
  noise_tolerance: number
  guest_frequency: number
  sleep_schedule: string
  work_schedule: string
  social_preference: number
  smoking: boolean
  pets: boolean
  overnight_guests: boolean
  interests: string
  notes: string
}

export function SetPreferencesModal({ tenantId, tenantEmail, onClose }: SetPreferencesModalProps) {
  const queryClient = useQueryClient()

  // Check if preferences already exist
  const { data: existingPreferences } = useQuery({
    queryKey: ['preferences', tenantId],
    queryFn: () => preferencesApi.getByTenant(tenantId),
    retry: false,
  })


  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      cleanliness_importance: 3,
      noise_tolerance: 3,
      guest_frequency: 3,
      sleep_schedule: 'flexible',
      work_schedule: 'remote',
      social_preference: 3,
      smoking: false,
      pets: false,
      overnight_guests: true,
      interests: '',
      notes: '',
    }
  })
  
  // Add this useEffect to populate form when data loads
  useEffect(() => {
    if (existingPreferences) {
      setValue('cleanliness_importance', existingPreferences.cleanliness_importance)
      setValue('noise_tolerance', existingPreferences.noise_tolerance)
      setValue('guest_frequency', existingPreferences.guest_frequency)
      setValue('sleep_schedule', existingPreferences.sleep_schedule)
      setValue('work_schedule', existingPreferences.work_schedule)
      setValue('social_preference', existingPreferences.social_preference)
      setValue('smoking', existingPreferences.smoking)
      setValue('pets', existingPreferences.pets)
      setValue('overnight_guests', existingPreferences.overnight_guests)
      setValue('interests', existingPreferences.interests || '')
      setValue('notes', existingPreferences.notes || '')
    }
  }, [existingPreferences, setValue])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (existingPreferences) {
        return preferencesApi.update(existingPreferences.id, data)
      }
      return preferencesApi.create({ tenant_id: tenantId, ...data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Preferences saved successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save preferences')
    },
  })

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data)
  }

  const cleanlinessValue = watch('cleanliness_importance')
  const noiseValue = watch('noise_tolerance')
  const guestValue = watch('guest_frequency')
  const socialValue = watch('social_preference')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Sparkles className="w-5 h-5 text-[#667eea]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {existingPreferences ? 'Edit' : 'Set'} Preferences
              </h2>
              <p className="text-sm text-[#98989d]">{tenantEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Lifestyle Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Lifestyle Preferences</h3>
            
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Cleanliness Importance: {cleanlinessValue}
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#636366]">Messy</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('cleanliness_importance', { valueAsNumber: true })}
                  className="flex-1 h-2 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#667eea]"
                />
                <span className="text-xs text-[#636366]">Very Clean</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Noise Tolerance: {noiseValue}
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#636366]">Quiet</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('noise_tolerance', { valueAsNumber: true })}
                  className="flex-1 h-2 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#667eea]"
                />
                <span className="text-xs text-[#636366]">Loud OK</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Guest Frequency: {guestValue}
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#636366]">Rarely</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('guest_frequency', { valueAsNumber: true })}
                  className="flex-1 h-2 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#667eea]"
                />
                <span className="text-xs text-[#636366]">Often</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Social Preference: {socialValue}
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#636366]">Introvert</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('social_preference', { valueAsNumber: true })}
                  className="flex-1 h-2 bg-[#2c2c2e] rounded-lg appearance-none cursor-pointer accent-[#667eea]"
                />
                <span className="text-xs text-[#636366]">Extrovert</span>
              </div>
            </div>
          </div>

          {/* Schedules */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Sleep Schedule
              </label>
              <select
                {...register('sleep_schedule')}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              >
                <option value="early_bird">Early Bird</option>
                <option value="night_owl">Night Owl</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Work Schedule
              </label>
              <select
                {...register('work_schedule')}
                className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              >
                <option value="remote">Remote</option>
                <option value="office">Office</option>
                <option value="hybrid">Hybrid</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {/* Dealbreakers */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Preferences</h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smoking"
                {...register('smoking')}
                className="w-4 h-4 rounded border-[#2c2c2e] bg-[#141414] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
              />
              <label htmlFor="smoking" className="text-sm text-[#98989d]">
                Smoking OK
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pets"
                {...register('pets')}
                className="w-4 h-4 rounded border-[#2c2c2e] bg-[#141414] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
              />
              <label htmlFor="pets" className="text-sm text-[#98989d]">
                Pets OK
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="overnight_guests"
                {...register('overnight_guests')}
                className="w-4 h-4 rounded border-[#2c2c2e] bg-[#141414] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
              />
              <label htmlFor="overnight_guests" className="text-sm text-[#98989d]">
                Overnight Guests OK
              </label>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              {...register('interests')}
              placeholder="e.g., fitness, cooking, gaming, music"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any other preferences or requirements..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] resize-none"
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
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
