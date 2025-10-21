import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api/properties'
import { maintenanceApi, MaintenanceWithDetails } from '@/lib/api/maintenance'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { LoadingScreen } from '@/components/ui/Spinner'
import { CreateMaintenanceModal } from '@/components/maintenance/CreateMaintenanceModal'
import { UpdateStatusModal } from '@/components/maintenance/UpdateStatusModal'
import { Wrench, Plus, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function MaintenancePage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceWithDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const maintenanceQuery = useQuery({
    queryKey: ['all-maintenance', properties?.map(p => p.id)],
    queryFn: async () => {
      if (!properties) return []
      const maintenancePromises = properties.map(p => maintenanceApi.getByProperty(p.id))
      const maintenanceArrays = await Promise.all(maintenancePromises)
      return maintenanceArrays.flat()
    },
    enabled: !!properties,
  })

  const deleteMutation = useMutation({
    mutationFn: maintenanceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-maintenance'] })
      toast.success('Request deleted')
    },
    onError: () => {
      toast.error('Failed to delete request')
    },
  })

  if (maintenanceQuery.isLoading) {
    return <LoadingScreen message="Loading maintenance requests..." />
  }

  const allRequests = maintenanceQuery.data || []

  // Apply filters
  const filteredRequests = allRequests.filter((request) => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false
    if (propertyFilter !== 'all' && request.property_name !== propertyFilter) return false

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.property_name.toLowerCase().includes(searchLower) ||
        request.room_number.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const openCount = allRequests.filter(r => r.status === 'open').length
  const inProgressCount = allRequests.filter(r => r.status === 'in_progress').length
  const urgentCount = allRequests.filter(r => r.priority === 'urgent' && r.status !== 'resolved' && r.status !== 'closed').length

  const priorityColors = {
    low: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
    medium: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    high: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20',
    urgent: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  const statusIcons = {
    open: <Clock className="w-5 h-5 text-[#ffd60a]" />,
    in_progress: <Wrench className="w-5 h-5 text-[#667eea]" />,
    resolved: <CheckCircle className="w-5 h-5 text-[#32d74b]" />,
    closed: <XCircle className="w-5 h-5 text-[#636366]" />,
  }

  const statusColors = {
    open: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    in_progress: 'bg-[#667eea]/10 text-[#667eea] border-[#667eea]/20',
    resolved: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    closed: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Maintenance</h1>
          <p className="text-[#98989d] mt-2">
            Track and manage maintenance requests
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Requests</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allRequests.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Open</p>
            <p className="text-2xl font-bold text-white mt-1">
              {openCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">In Progress</p>
            <p className="text-2xl font-bold text-white mt-1">
              {inProgressCount}
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
      {allRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by title, description, or location..."
            />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <FilterDropdown
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
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

      {/* Requests List */}
      {allRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No maintenance requests yet
            </h3>
            <p className="text-[#98989d] mb-6">
              Create your first maintenance request to get started
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No requests found matching your filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
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
                {filteredRequests.length} {filteredRequests.length === 1 ? 'Request' : 'Requests'}
              </h2>
              {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || propertyFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
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
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                          {statusIcons[request.status]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{request.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[request.priority]}`}>
                              {request.priority}
                            </span>
                          </div>
                          <p className="text-sm text-[#98989d]">
                            {request.property_name} - Unit {request.unit_number}, Room {request.room_number}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[#98989d] mb-4">
                        {request.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[request.status]}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className="text-[#636366]">
                            Created {formatDate(request.created_at)}
                          </span>
                          {request.assigned_to && (
                            <span className="text-[#98989d]">
                              Assigned to: {request.assigned_to}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {request.status !== 'resolved' && request.status !== 'closed' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Update Status
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm('Delete this maintenance request?')) {
                                deleteMutation.mutate(request.id)
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
        <CreateMaintenanceModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedRequest && (
        <UpdateStatusModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
