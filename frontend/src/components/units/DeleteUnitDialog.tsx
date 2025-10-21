import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unitsApi } from '@/lib/api/units'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteUnitDialogProps {
  unitId: string
  unitNumber: string
  propertyId: string
  onClose: () => void
}

export function DeleteUnitDialog({ unitId, unitNumber, propertyId, onClose }: DeleteUnitDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => unitsApi.delete(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['units-with-rooms'] })
      toast.success('Unit deleted successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete unit')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ff453a]/10">
                <AlertTriangle className="w-5 h-5 text-[#ff453a]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Delete Unit</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
            >
              <X className="w-5 h-5 text-[#98989d]" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/20">
              <p className="text-[#ff453a] font-medium mb-2">Warning</p>
              <p className="text-[#98989d] text-sm">
                This will permanently delete Unit {unitNumber} and all its rooms. 
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Unit'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
