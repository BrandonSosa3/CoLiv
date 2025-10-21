import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EditRoomModal } from '@/components/rooms/EditRoomModal'
import { DeleteRoomDialog } from '@/components/rooms/DeleteRoomDialog'
import { CreateTenantModal } from '@/components/tenants/CreateTenantModal'
import { Room } from '@/types'
import { Bed, User, Edit2, Trash2, UserPlus, Calendar, Mail } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RoomCardProps {
  room: Room & {
    tenant?: {
      id: string
      name: string
      email: string
      lease_start: string
      lease_end: string
      status: string
    }
  }
  unitId: string
  propertyId: string
}

export function RoomCard({ room, unitId, propertyId }: RoomCardProps) {
  const [showEditRoom, setShowEditRoom] = useState(false)
  const [showDeleteRoom, setShowDeleteRoom] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)

  const statusColors = {
    vacant: 'bg-[#636366]/10 text-[#636366] border-[#636366]/20',
    occupied: 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20',
    maintenance: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <Bed className="w-4 h-4 text-[#667eea]" />
              </div>
              <div>
                <h4 className="font-medium text-white">Room {room.room_number}</h4>
                <p className="text-sm text-[#98989d]">{room.room_type}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {room.status === 'vacant' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAddTenant(true)}
                  className="bg-[#32d74b]/10 hover:bg-[#32d74b]/20 text-[#32d74b] border-[#32d74b]/20"
                >
                  <UserPlus className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowEditRoom(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteRoom(true)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#636366]">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[room.status]}`}>
                {room.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#636366]">Rent</span>
              <span className="text-white font-medium">
                {formatCurrency(Number(room.rent_amount))}/mo
              </span>
            </div>
            {room.size_sqft && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#636366]">Size</span>
                <span className="text-white">{room.size_sqft} sq ft</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#636366]">Private Bath</span>
              <span className="text-white">{room.has_private_bath ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Tenant Information */}
          {room.tenant && room.status === 'occupied' && (
            <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#32d74b]" />
                <span className="text-sm font-medium text-white">Current Tenant</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-[#636366]" />
                  <span className="text-[#98989d]">{room.tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3 h-3 text-[#636366]" />
                  <span className="text-[#98989d]">
                    {new Date(room.tenant.lease_start).toLocaleDateString()} - {new Date(room.tenant.lease_end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Add Tenant Button for Vacant Rooms */}
          {room.status === 'vacant' && (
            <div className="mt-4 pt-4 border-t border-[#2c2c2e]">
              <Button
                size="sm"
                onClick={() => setShowAddTenant(true)}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showEditRoom && (
        <EditRoomModal
          room={room}
          onClose={() => setShowEditRoom(false)}
        />
      )}

      {showDeleteRoom && (
        <DeleteRoomDialog
          roomId={room.id}
          roomNumber={room.room_number}
          unitId={unitId}
          propertyId={propertyId}
          onClose={() => setShowDeleteRoom(false)}
        />
      )}

      {showAddTenant && (
        <CreateTenantModal
          preSelectedRoomId={room.id}
          preSelectedPropertyId={propertyId}
          onClose={() => setShowAddTenant(false)}
        />
      )}
    </>
  )
}
