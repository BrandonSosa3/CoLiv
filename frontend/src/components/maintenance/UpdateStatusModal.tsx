import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { maintenanceApi, MaintenanceRequest } from '@/lib/api/maintenance'
import { Button } from '@/components/ui/Button'
import { X, CheckCircle } from 'lucide-react'

interface UpdateStatusModalProps {
  request: MaintenanceRequest
  onClose: () => void
}

interface FormData {
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to_name?: string
}

export function UpdateStatusModal({ request, onClose }: UpdateStatusModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      status: request.status,
      assigned_to_name: request.assigned_to || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => maintenanceApi.update(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-maintenance'] })
      toast.success('Request updated')
      onClose()
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      toast.error(error.response?.data?.detail || 'Failed to update request')
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <CheckCircle className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Update Status</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Assigned To (Optional)
            </label>
            <input
              type="text"
              {...register('assigned_to_name')}
              placeholder="e.g., John the Plumber"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
