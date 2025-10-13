import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { announcementsApi, Announcement } from '@/lib/api/announcements'
import { Button } from '@/components/ui/Button'
import { X, Edit2 } from 'lucide-react'

interface EditAnnouncementModalProps {
  announcement: Announcement
  onClose: () => void
}

interface FormData {
  title: string
  message: string  // Changed from 'content' to 'message'
  priority: 'normal' | 'important' | 'urgent'
}

export function EditAnnouncementModal({ announcement, onClose }: EditAnnouncementModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: announcement.title,
      message: announcement.message,  // Changed from content to message
      priority: announcement.priority,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => announcementsApi.update(announcement.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] })
      toast.success('Announcement updated')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update announcement')
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-between p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <Edit2 className="w-5 h-5 text-[#667eea]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Edit Announcement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#98989d] mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
