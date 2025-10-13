import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api/properties'
import { announcementsApi, AnnouncementWithDetails } from '@/lib/api/announcements'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { LoadingScreen } from '@/components/ui/Spinner'
import { CreateAnnouncementModal } from '@/components/announcements/CreateAnnouncementModal'
import { EditAnnouncementModal } from '@/components/announcements/EditAnnouncementModal'
import { Megaphone, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const announcementsQuery = useQuery({
    queryKey: ['all-announcements', properties?.map(p => p.id)],
    queryFn: async () => {
      if (!properties) return []
      const announcementsPromises = properties.map(p => announcementsApi.getByProperty(p.id))
      const announcementsArrays = await Promise.all(announcementsPromises)
      return announcementsArrays.flat()
    },
    enabled: !!properties,
  })

  const deleteMutation = useMutation({
    mutationFn: announcementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
      toast.success('Announcement deleted')
    },
    onError: () => {
      toast.error('Failed to delete announcement')
    },
  })

  if (announcementsQuery.isLoading) {
    return <LoadingScreen message="Loading announcements..." />
  }

  const allAnnouncements = announcementsQuery.data || []

  // Apply filters
  const filteredAnnouncements = allAnnouncements.filter((announcement) => {
    if (priorityFilter !== 'all' && announcement.priority !== priorityFilter) return false
    if (propertyFilter !== 'all' && announcement.property_name !== propertyFilter) return false

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.message.toLowerCase().includes(searchLower) ||  // Changed from content to message
        announcement.property_name.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const urgentCount = allAnnouncements.filter(a => a.priority === 'urgent').length
  const importantCount = allAnnouncements.filter(a => a.priority === 'important').length

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          <p className="text-[#98989d] mt-2">
            Create and manage property announcements
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Announcements</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allAnnouncements.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Important</p>
            <p className="text-2xl font-bold text-white mt-1">
              {importantCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Urgent</p>
            <p className="text-2xl font-bold text-[#ff453a] mt-1">
              {urgentCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {allAnnouncements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by title, message, or property..."
            />
          </div>
          <FilterDropdown
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'important', label: 'Important' },
              { value: 'normal', label: 'Normal' },
            ]}
          />
          <FilterDropdown
            label="Property"
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={[
              { value: 'all', label: 'All Properties' },
              ...(properties?.map(p => ({ value: p.name, label: p.name })) || []),
            ]}
          />
        </div>
      )}

      {/* Announcements List */}
      {allAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No announcements yet
            </h3>
            <p className="text-[#98989d] mb-6">
              Create your first announcement to notify tenants
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No announcements found matching your filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setPriorityFilter('all')
                setPropertyFilter('all')
              }}
              className="text-[#667eea] hover:underline"
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
              </h2>
              {(searchQuery || priorityFilter !== 'all' || propertyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setPriorityFilter('all')
                    setPropertyFilter('all')
                  }}
                  className="text-sm text-[#667eea] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                          {priorityIcons[announcement.priority]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{announcement.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[announcement.priority]}`}>
                              {announcement.priority}
                            </span>
                          </div>
                          <p className="text-sm text-[#98989d]">
                            {announcement.property_name}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[#98989d] mb-4 whitespace-pre-wrap">
                        {announcement.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#636366]">
                          Posted {formatDate(announcement.created_at)}
                        </span>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedAnnouncement(announcement)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm('Delete this announcement?')) {
                                deleteMutation.mutate(announcement.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateAnnouncementModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedAnnouncement && (
        <EditAnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  )
}
