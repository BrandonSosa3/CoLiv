import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tenantsApi } from '@/lib/api/tenants'
import { Room } from '@/types'
import { DoorOpen, Check, X, Plus, User, Edit2, UserX } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { AssignTenantModal } from './AssignTenantModal'
import { EditRoomModal } from './EditRoomModal'
import { RemoveTenantDialog } from '@/components/tenants/RemoveTenantDialog'

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  // Fetch tenant info if room is occupied
  const { data: tenants } = useQuery({
    queryKey: ['room-tenant', room.id],
    queryFn: () => tenantsApi.getByRoom(room.id),
    enabled: room.status === 'occupied',
  })

  const tenant = tenants?.[0]

  const statusColors = {
    vacant: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    occupied: 'bg-[#667eea]/10 text-[#667eea] border-[#667eea]/20',
    maintenance: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
  }

  return (
    <>
      <div className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
              <DoorOpen className="w-4 h-4 text-[#667eea]" />
            </div>
            <span className="font-semibold text-white">Room {room.room_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 rounded hover:bg-[#2c2c2e] transition-colors"
              title="Edit room"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#98989d] hover:text-[#667eea]" />
            </button>
            <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[room.status]}`}>
              {room.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#636366]">Rent</span>
            <span className="font-semibold text-white">
              {formatCurrency(Number(room.rent_amount))}/mo
            </span>
          </div>

          {room.size_sqft && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#636366]">Size</span>
              <span className="text-sm text-[#98989d]">{room.size_sqft} sq ft</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#636366]">Private Bath</span>
            {room.has_private_bath ? (
              <Check className="w-4 h-4 text-[#32d74b]" />
            ) : (
              <X className="w-4 h-4 text-[#636366]" />
            )}
          </div>
        </div>

        {room.status === 'vacant' && (
          <Button
            size="sm"
            className="w-full mt-4"
            onClick={() => setShowAssignModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign Tenant
          </Button>
        )}

        {room.status === 'occupied' && tenant && (
          <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-[#98989d]">
                <User className="w-4 h-4" />
                <span className="truncate">{tenant.email}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onClick={() => setShowRemoveDialog(true)}
            >
              <UserX className="w-4 h-4 mr-2" />
              Remove Tenant
            </Button>
          </div>
        )}
      </div>

      {showAssignModal && (
        <AssignTenantModal
          roomId={room.id}
          roomNumber={room.room_number}
          rentAmount={Number(room.rent_amount)}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {showEditModal && (
        <EditRoomModal
          room={room}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showRemoveDialog && tenant && (
        <RemoveTenantDialog
          tenantId={tenant.id}
          tenantEmail={tenant.email}
          roomNumber={room.room_number}
          onClose={() => setShowRemoveDialog(false)}
        />
      )}
    </>
  )
}
