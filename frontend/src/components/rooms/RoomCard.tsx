import { useState } from 'react'
import { Room } from '@/types'
import { DoorOpen, Check, X, Plus, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { AssignTenantModal } from './AssignTenantModal'

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  const [showAssignModal, setShowAssignModal] = useState(false)

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
          <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[room.status]}`}>
            {room.status}
          </span>
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

        {room.status === 'occupied' && (
          <div className="mt-4 pt-4 border-t border-[#2c2c2e] flex items-center gap-2 text-sm text-[#98989d]">
            <User className="w-4 h-4" />
            <span>Tenant assigned</span>
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
    </>
  )
}
