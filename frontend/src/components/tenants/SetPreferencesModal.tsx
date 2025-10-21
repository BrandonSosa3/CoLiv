import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { preferencesApi } from '@/lib/api/preferences'
import { Button } from '@/components/ui/Button'
import { X, Users } from 'lucide-react'

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

export function SetPreferencesModal({
  tenantId,
  tenantEmail,
  onClose,
}: SetPreferencesModalProps) {
  const queryClient = useQueryClient()
  const [existingPrefId, setExistingPrefId] = useState<string | null>(null)

  // Try to fetch existing preferences
  const { data: existingPrefs } = useQuery({
    queryKey: ['tenant-preference', tenantId],
    queryFn: () => preferencesApi.getByTenant(tenantId),
    retry: false,
  })

  const { register, handleSubmit, } = useForm<FormData>({
    defaultValues: existingPrefs || {
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
    },
  })

  useEffect(() => {
    if (existingPrefs) {
      setExistingPrefId(existingPrefs.id)
    }
  }, [existingPrefs])

  const createMutation = useMutation({
    mutationFn: preferencesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-preference', tenantId] })
      toast.success('Preferences saved successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save preferences')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FormData>) => preferencesApi.update(existingPrefId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-preference', tenantId] })
      toast.success('Preferences updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update preferences')
    },
  })

  const onSubmit = (data: FormData) => {
    if (existingPrefId) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate({
        tenant_id: tenantId,
        ...data,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Users className="w-5 h-5 text-[#667eea]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Set Preferences</h2>
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
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Lifestyle Preferences</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Cleanliness Importance (1=Messy, 5=Very Clean)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('cleanliness_importance')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#636366] mt-1">
                  <span>Messy</span>
                  <span>Very Clean</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Noise Tolerance (1=Quiet, 5=Loud OK)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('noise_tolerance')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#636366] mt-1">
                  <span>Quiet</span>
                  <span>Loud OK</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Guest Frequency (1=Never, 5=Often)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('guest_frequency')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#636366] mt-1">
                  <span>Never</span>
                  <span>Often</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Social Preference (1=Introvert, 5=Extrovert)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('social_preference')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#636366] mt-1">
                  <span>Introvert</span>
                  <span>Extrovert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Schedule</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Sleep Schedule
                </label>
                <select
                  {...register('sleep_schedule')}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
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
                  className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                >
                  <option value="remote">Remote</option>
                  <option value="office">Office</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dealbreakers */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Dealbreakers</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smoking"
                  {...register('smoking')}
                  className="w-4 h-4 rounded border-[#2c2c2e] bg-[#141414] text-[#667eea] focus:ring-2 focus:ring-[#667eea]"
                />
                <label htmlFor="smoking" className="text-sm text-[#98989d]">
                  Smoking allowed
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
                  Pets allowed
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
                  Overnight guests allowed
                </label>
              </div>
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
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
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
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none"
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
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
