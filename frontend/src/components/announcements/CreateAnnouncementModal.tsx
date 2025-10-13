import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { announcementsApi } from '@/lib/api/announcements'
import { propertiesApi } from '@/lib/api/properties'
import { Button } from '@/components/ui/Button'
import { X, Megaphone } from 'lucide-react'

interface CreateAnnouncementModalProps {
  onClose: () => void
}

interface FormData {
  property_id: string
  title: string
  message: string  // Changed from 'content' to 'message'
  priority: 'normal' | 'important' | 'urgent'
}

export function CreateAnnouncementModal({ onClose }: CreateAnnouncementModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      priority: 'normal',
    },
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
      toast.success('Announcement created')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create announcement')
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Megaphone className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Announcement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Property *
            </label>
            <select
              {...register('property_id', { required: 'Property is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="">Select property...</option>
              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {errors.property_id && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.property_id.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Pool maintenance scheduled"
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Message *
            </label>
            <textarea
              {...register('message', { required: 'Message is required' })}
              placeholder="Enter announcement details..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.message.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Priority *
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
            >
              <option value="normal">Normal - Standard announcement</option>
              <option value="important">Important - Requires attention</option>
              <option value="urgent">Urgent - Immediate action needed</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-[#ff453a]">{errors.priority.message}</p>
            )}
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
              {createMutation.isPending ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
