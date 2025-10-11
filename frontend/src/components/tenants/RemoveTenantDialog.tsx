import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/lib/api/tenants'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, X } from 'lucide-react'

interface RemoveTenantDialogProps {
  tenantId: string
  tenantEmail: string
  roomNumber: string
  onClose: () => void
}

export function RemoveTenantDialog({
  tenantId,
  tenantEmail,
  roomNumber,
  onClose,
}: RemoveTenantDialogProps) {
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: () => tenantsApi.delete(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['all-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['operator-metrics'] })
      toast.success(`Tenant removed from Room ${roomNumber}`)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to remove tenant')
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
            <h2 className="text-xl font-semibold text-white">Remove Tenant</h2>
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
            Are you sure you want to remove <span className="text-white font-semibold">{tenantEmail}</span> from Room {roomNumber}?
          </p>
          <p className="text-sm text-[#ff453a] mb-6">
            This will mark the room as vacant and remove the tenant assignment. The tenant's user account will remain active.
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
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Tenant'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
