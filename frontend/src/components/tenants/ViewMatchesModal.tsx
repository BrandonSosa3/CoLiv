import { useQuery } from '@tanstack/react-query'
import { preferencesApi, RoommateMatch } from '@/lib/api/preferences'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { X, Users, TrendingUp, Award } from 'lucide-react'

interface ViewMatchesModalProps {
  tenantId: string
  tenantEmail: string
  onClose: () => void
}

export function ViewMatchesModal({ tenantId, tenantEmail, onClose }: ViewMatchesModalProps) {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', tenantId],
    queryFn: () => preferencesApi.getMatches(tenantId, 10),
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#32d74b]'
    if (score >= 60) return 'text-[#ffd60a]'
    return 'text-[#ff9f0a]'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match'
    if (score >= 80) return 'Great Match'
    if (score >= 70) return 'Good Match'
    if (score >= 60) return 'Fair Match'
    return 'Poor Match'
  }

  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-[#32d74b]/20 text-[#32d74b]'
    if (score >= 60) return 'bg-[#ffd60a]/20 text-[#ffd60a]'
    return 'bg-[#ff9f0a]/20 text-[#ff9f0a]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl my-8">
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
          {isLoading ? (
            <LoadingScreen message="Calculating compatibility..." />
          ) : !matches || matches.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-[#636366] mb-4" />
              <p className="text-[#98989d] mb-2">No matches found</p>
              <p className="text-sm text-[#636366]">
                Other tenants need to set their preferences first
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-[#98989d]">
                <Award className="w-4 h-4" />
                <span>Top {matches.length} most compatible roommates</span>
              </div>

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
                          {match.current_room_id && (
                            <p className="text-sm text-[#636366]">
                              Room ID: {match.current_room_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(match.compatibility_score)}`}>
                          {Math.round(match.compatibility_score)}%
                        </div>
                        <p className="text-sm text-[#98989d]">{getScoreLabel(match.compatibility_score)}</p>
                      </div>
                    </div>

                    {/* Compatibility Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Cleanliness</p>
                        <div className={`text-lg font-semibold ${getCategoryColor(match.breakdown.cleanliness)}`}>
                          {Math.round(match.breakdown.cleanliness)}%
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Noise</p>
                        <div className={`text-lg font-semibold ${getCategoryColor(match.breakdown.noise)}`}>
                          {Math.round(match.breakdown.noise)}%
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Sleep</p>
                        <div className={`text-lg font-semibold ${getCategoryColor(match.breakdown.sleep_schedule)}`}>
                          {Math.round(match.breakdown.sleep_schedule)}%
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#141414]">
                        <p className="text-xs text-[#636366] mb-1">Social</p>
                        <div className={`text-lg font-semibold ${getCategoryColor(match.breakdown.social)}`}>
                          {Math.round(match.breakdown.social)}%
                        </div>
                      </div>
                    </div>

                    {/* Common Interests */}
                    {match.common_interests && match.common_interests.length > 0 && (
                      <div className="pt-4 border-t border-[#2c2c2e]">
                        <p className="text-xs text-[#636366] mb-2 flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          Common Interests
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.common_interests.map((interest: string) => (
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
