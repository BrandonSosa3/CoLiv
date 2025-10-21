import { useQuery } from '@tanstack/react-query'
import { announcementsApi } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Megaphone, AlertCircle } from 'lucide-react'

export function AnnouncementsPage() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['tenant-announcements'],
    queryFn: announcementsApi.getMyAnnouncements,
  })

  if (isLoading) {
    return <LoadingScreen message="Loading announcements..." />
  }

  const urgentAnnouncements = announcements?.filter((a: any) => a.priority === 'urgent') || []
  const importantAnnouncements = announcements?.filter((a: any) => a.priority === 'important') || []

  const priorityIcons = {
    normal: <Megaphone className="w-5 h-5 text-[#667eea]" />,
    important: <AlertCircle className="w-5 h-5 text-[#ff9f0a]" />,
    urgent: <AlertCircle className="w-5 h-5 text-[#ff453a]" />,
  }

  const priorityColors = {
    normal: 'bg-[#667eea]/10 text-[#667eea] border-[#667eea]/20',
    important: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20',
    urgent: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Announcements</h1>
        <p className="text-[#98989d] mt-2">
          Important updates from your property manager
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-[#667eea]" />
              <div>
                <p className="text-sm text-[#636366]">Total</p>
                <p className="text-2xl font-bold text-white">{announcements?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[#ff9f0a]" />
              <div>
                <p className="text-sm text-[#636366]">Important</p>
                <p className="text-2xl font-bold text-white">{importantAnnouncements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[#ff453a]" />
              <div>
                <p className="text-sm text-[#636366]">Urgent</p>
                <p className="text-2xl font-bold text-[#ff453a]">{urgentAnnouncements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      {announcements && announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No announcements yet
            </h3>
            <p className="text-[#98989d]">
              Check back later for updates from your property manager
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Recent Announcements</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements?.map((announcement: any) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e]"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                      {priorityIcons[announcement.priority as keyof typeof priorityIcons]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{announcement.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[announcement.priority as keyof typeof priorityColors]}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-[#98989d] whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#636366]">
                    Posted {new Date(announcement.created_at).toLocaleDateString()} at{' '}
                    {new Date(announcement.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
