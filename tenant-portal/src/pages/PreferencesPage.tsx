import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { preferencesApi, RoommateMatch } from '@/lib/api/preferences'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Sparkles, Users } from 'lucide-react'

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

export function PreferencesPage() {
  const queryClient = useQueryClient()
  const [showMatches, setShowMatches] = useState(false)

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['my-preferences'],
    queryFn: preferencesApi.getMy,
    retry: false,
  })

  const { data: matches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => preferencesApi.getMyMatches(10),
    enabled: showMatches && !!preferences,
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
    if (preferences) {
      setValue('cleanliness_importance', preferences.cleanliness_importance)
      setValue('noise_tolerance', preferences.noise_tolerance)
      setValue('guest_frequency', preferences.guest_frequency)
      setValue('sleep_schedule', preferences.sleep_schedule)
      setValue('work_schedule', preferences.work_schedule)
      setValue('social_preference', preferences.social_preference)
      setValue('smoking', preferences.smoking)
      setValue('pets', preferences.pets)
      setValue('overnight_guests', preferences.overnight_guests)
      setValue('interests', preferences.interests || '')
      setValue('notes', preferences.notes || '')
    }
  }, [preferences, setValue])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (preferences) {
        return preferencesApi.updateMy(data)
      }
      return preferencesApi.createMy(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-preferences'] })
      queryClient.invalidateQueries({ queryKey: ['my-matches'] })
      toast.success('Preferences saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save preferences')
    },
  })

  if (isLoading) {
    return <LoadingScreen message="Loading preferences..." />
  }

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data)
  }

  const cleanlinessValue = watch('cleanliness_importance')
  const noiseValue = watch('noise_tolerance')
  const guestValue = watch('guest_frequency')
  const socialValue = watch('social_preference')

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-[#32d74b]'
    if (score >= 60) return 'text-[#ffd60a]'
    return 'text-[#ff9f0a]'
  }

  const getCompatibilityBg = (score: number) => {
    if (score >= 80) return 'bg-[#32d74b]/10 border-[#32d74b]/20'
    if (score >= 60) return 'bg-[#ffd60a]/10 border-[#ffd60a]/20'
    return 'bg-[#ff9f0a]/10 border-[#ff9f0a]/20'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Roommate Preferences</h1>
          <p className="text-[#98989d] mt-2">
            Help us find your perfect roommates with AI matching
          </p>
        </div>
        {preferences && (
          <Button onClick={() => setShowMatches(!showMatches)}>
            <Users className="w-4 h-4 mr-2" />
            {showMatches ? 'Hide Matches' : 'View Matches'}
          </Button>
        )}
      </div>

      {showMatches && matches ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#667eea]" />
            Your Top Roommate Matches
          </h2>
          
          {matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-[#98989d]">
                  No matches found yet. More tenants need to set their preferences.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match: RoommateMatch) => (
                <Card key={match.tenant_id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                          <Users className="w-5 h-5 text-[#667eea]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{match.email}</h3>
                          <p className="text-sm text-[#98989d]">Potential Roommate</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg border ${getCompatibilityBg(match.compatibility_score)}`}>
                        <p className={`text-lg font-bold ${getCompatibilityColor(match.compatibility_score)}`}>
                          {Math.round(match.compatibility_score)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#636366]">Cleanliness</span>
                        <span className="text-white">{Math.round(match.breakdown.cleanliness)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#636366]">Noise Tolerance</span>
                        <span className="text-white">{Math.round(match.breakdown.noise)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#636366]">Sleep Schedule</span>
                        <span className="text-white">{Math.round(match.breakdown.sleep_schedule)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#636366]">Social Compatibility</span>
                        <span className="text-white">{Math.round(match.breakdown.social)}%</span>
                      </div>
                    </div>

                    {match.common_interests && match.common_interests.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
                        <p className="text-xs text-[#636366] mb-2">Common Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {match.common_interests.map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-1 rounded-full bg-[#667eea]/10 text-[#667eea] text-xs"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            variant="secondary"
            onClick={() => setShowMatches(false)}
            className="w-full"
          >
            Back to Preferences
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Lifestyle Preferences</h2>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Schedules</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Preferences</h2>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">About You</h2>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={saveMutation.isPending}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : preferences ? 'Update Preferences' : 'Save Preferences'}
          </Button>
        </form>
      )}
    </div>
  )
}
