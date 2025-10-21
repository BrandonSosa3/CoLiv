import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { maintenanceApi } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Wrench, Plus, Clock, CheckCircle} from 'lucide-react'

export function MaintenancePage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['tenant-maintenance'],
    queryFn: maintenanceApi.getMyRequests,
  })

  if (isLoading) {
    return <LoadingScreen message="Loading maintenance requests..." />
  }

  const openRequests = requests?.filter((r: any) => r.status === 'open') || []
  const inProgressRequests = requests?.filter((r: any) => r.status === 'in_progress') || []
  const resolvedRequests = requests?.filter((r: any) => r.status === 'resolved') || []

  const statusIcons = {
    open: <Clock className="w-5 h-5 text-[#ffd60a]" />,
    in_progress: <Wrench className="w-5 h-5 text-[#667eea]" />,
    resolved: <CheckCircle className="w-5 h-5 text-[#32d74b]" />,
    closed: <CheckCircle className="w-5 h-5 text-[#636366]" />,
  }

  const statusColors = {
    open: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
    in_progress: 'bg-[#667eea]/10 text-[#667eea] border-[#667eea]/20',
    resolved: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    closed: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
  }

  const priorityColors = {
    low: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
    normal: 'bg-[#667eea]/10 text-[#667eea] border-[#667eea]/20',
    high: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20',
    urgent: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Maintenance Requests</h1>
          <p className="text-[#98989d] mt-2">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#ffd60a]" />
              <div>
                <p className="text-sm text-[#636366]">Open</p>
                <p className="text-2xl font-bold text-white">{openRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-[#667eea]" />
              <div>
                <p className="text-sm text-[#636366]">In Progress</p>
                <p className="text-2xl font-bold text-white">{inProgressRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-[#32d74b]" />
              <div>
                <p className="text-sm text-[#636366]">Resolved</p>
                <p className="text-2xl font-bold text-white">{resolvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests && requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No maintenance requests yet
            </h3>
            <p className="text-[#98989d] mb-6">
              Submit your first maintenance request to get started
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">
              {requests?.length} {requests?.length === 1 ? 'Request' : 'Requests'}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests?.map((request: any) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                      {statusIcons[request.status as keyof typeof statusIcons]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{request.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[request.priority as keyof typeof priorityColors]}`}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-sm text-[#98989d]">{request.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[request.status as keyof typeof statusColors]}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span className="text-[#636366]">
                      Submitted {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {request.assigned_to && (
                    <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
                      <p className="text-sm text-[#98989d]">
                        Assigned to: {request.assigned_to}
                      </p>
                    </div>
                  )}

                  {request.resolved_at && (
                    <div className="mt-3 pt-3 border-t border-[#2c2c2e]">
                      <p className="text-sm text-[#32d74b]">
                        ✓ Resolved on {new Date(request.resolved_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <CreateMaintenanceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

// Create Maintenance Modal Component
function CreateMaintenanceModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')

  const createMutation = useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] })
      toast.success('Maintenance request submitted')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit request')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ title, description, priority })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-[#2c2c2e]">
          <h2 className="text-xl font-semibold text-white">Submit Maintenance Request</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leaky faucet in bathroom"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="low">Low - Can wait a week</option>
              <option value="normal">Normal - Fix within a few days</option>
              <option value="high">High - Fix within 24 hours</option>
              <option value="urgent">Urgent - Fix immediately</option>
            </select>
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
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
