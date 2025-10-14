import { useQuery } from '@tanstack/react-query'
import { preferencesApi, RoommateMatch } from '@/lib/api/preferences'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { X, Users, Heart, TrendingUp } from 'lucide-react'

interface ViewMatchesModalProps {
  tenantId: string
  tenantEmail: string
  onClose: () => void
}

export function ViewMatchesModal({
  tenantId,
  tenantEmail,
  onClose,
}: ViewMatchesModalProps) {
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['roommate-matches', tenantId],
    queryFn: () => preferencesApi.getMatches(tenantId, 5),
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#32d74b]'
    if (score >= 60) return 'text-[#ffd60a]'
    return 'text-[#ff9f0a]'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    return 'Fair Match'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Users className="w-5 h-5 text-[#667eea]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Roommate Matches</h2>
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

        <div className="p-6">
          {isLoading && <LoadingScreen message="Finding best matches..." />}

          {error && (
            <div className="text-center py-12">
              <p className="text-[#ff453a] mb-4">
                {(error as any).response?.data?.detail || 'Failed to load matches. Make sure preferences are set.'}
              </p>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          {matches && matches.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-[#667eea]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No matches found
              </h3>
              <p className="text-[#98989d] mb-6">
                There are no other tenants with preferences set
              </p>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          {matches && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match: RoommateMatch, index: number) => (
                <Card key={match.tenant_id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-bold text-lg">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{match.email}</p>
                          <p className="text-sm text-[#636366]">Room ID: {match.current_room_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(match.compatibility_score)}`}>
                          {match.compatibility_score}%
                        </div>
                        <p className="text-sm text-[#98989d]">{getScoreLabel(match.compatibility_score)}</p>
                      </div>
                    </div>

                    {/* Compatibility Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Cleanliness</p>
                        <p className="text-lg font-semibold text-white">{match.breakdown.cleanliness}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Schedule</p>
                        <p className="text-lg font-semibold text-white">{match.breakdown.sleep_schedule}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Social</p>
                        <p className="text-lg font-semibold text-white">{match.breakdown.social}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Dealbreakers</p>
                        <p className="text-lg font-semibold text-white">{match.breakdown.dealbreakers}%</p>
                      </div>
                    </div>

                    {/* Common Interests */}
                    {match.common_interests && match.common_interests.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#ff453a]" />
                        <p className="text-sm text-[#98989d]">
                          Common interests: <span className="text-white">{match.common_interests.join(', ')}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button variant="secondary" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
