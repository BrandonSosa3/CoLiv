import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/lib/api/properties'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, X } from 'lucide-react'

interface DeletePropertyDialogProps {
  propertyId: string
  propertyName: string
  onClose: () => void
  onSuccess?: () => void
}

export function DeletePropertyDialog({
  propertyId,
  propertyName,
  onClose,
  onSuccess,
}: DeletePropertyDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => propertiesApi.delete(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast.success(`Property "${propertyName}" deleted successfully`)
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete property')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff453a]/10">
              <AlertTriangle className="w-5 h-5 text-[#ff453a]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Delete Property</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
          >
            <X className="w-5 h-5 text-[#98989d]" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[#98989d] mb-4">
            Are you sure you want to delete <span className="text-white font-semibold">"{propertyName}"</span>?
          </p>
          <p className="text-sm text-[#ff453a] mb-6">
            This will permanently delete the property and all associated units, rooms, and tenants. This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Property'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
