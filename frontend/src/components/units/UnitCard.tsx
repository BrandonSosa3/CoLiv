import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal'
import { EditUnitModal } from '@/components/units/EditUnitModal'
import { DeleteUnitDialog } from '@/components/units/DeleteUnitDialog'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Unit, Room } from '@/types'
import { Home, Plus, Bed, Bath, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface UnitCardProps {
  unit: Unit
  rooms: Room[]
  propertyId: string
}

export function UnitCard({ unit, rooms, propertyId }: UnitCardProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showEditUnit, setShowEditUnit] = useState(false)
  const [showDeleteUnit, setShowDeleteUnit] = useState(false)

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
  const totalRevenue = rooms
    .filter(r => r.status === 'occupied')
    .reduce((sum, r) => sum + Number(r.rent_amount), 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-[#667eea]" />
                Unit {unit.unit_number}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-[#98989d]">
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {rooms.length} rooms
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  {unit.bathrooms} bathrooms
                </span>
                <span>
                  {occupiedRooms}/{rooms.length} occupied
                </span>
                <span className="font-medium text-white">
                  {formatCurrency(totalRevenue)}/mo
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowEditUnit(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteUnit(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Rooms</h4>
              <Button 
                size="sm" 
                onClick={() => setShowCreateRoom(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-8 text-[#636366]">
                <p>No rooms yet. Add the first room to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    unitId={unit.id}
                    propertyId={propertyId}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showCreateRoom && (
        <CreateRoomModal
          unitId={unit.id}
          onClose={() => setShowCreateRoom(false)}
        />
      )}

      {showEditUnit && (
        <EditUnitModal
          unit={unit}
          onClose={() => setShowEditUnit(false)}
        />
      )}

      {showDeleteUnit && (
        <DeleteUnitDialog
          unitId={unit.id}
          unitNumber={unit.unit_number}
          propertyId={propertyId}
          onClose={() => setShowDeleteUnit(false)}
        />
      )}
    </>
  )
}
