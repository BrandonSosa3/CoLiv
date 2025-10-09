import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Unit, Room } from '@/types'
import { Home, Plus, Bed, Bath } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface UnitCardProps {
  unit: Unit
  rooms: Room[]
}

export function UnitCard({ unit, rooms }: UnitCardProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false)

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
  const totalRevenue = rooms
    .filter(r => r.status === 'occupied')
    .reduce((sum, r) => sum + Number(r.rent_amount), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20">
                <Home className="w-5 h-5 text-[#667eea]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Unit {unit.unit_number}
                </h3>
                <div className="flex items-center gap-4 text-sm text-[#98989d] mt-1">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {unit.bedrooms} bed
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {unit.bathrooms} bath
                  </span>
                  {unit.square_feet && (
                    <span>{unit.square_feet} sq ft</span>
                  )}
                  {unit.furnished && (
                    <span className="px-2 py-0.5 rounded-full bg-[#667eea]/20 text-[#667eea] text-xs">
                      Furnished
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button size="sm" onClick={() => setShowCreateRoom(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {rooms.length > 0 && (
          <div className="flex items-center gap-6 mb-4 pb-4 border-b border-[#2c2c2e]">
            <div>
              <p className="text-sm text-[#636366]">Rooms</p>
              <p className="text-lg font-semibold text-white">
                {occupiedRooms}/{rooms.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#636366]">Monthly Revenue</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#98989d] mb-4">
              No rooms yet. Add rooms with individual pricing.
            </p>
            <Button size="sm" onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </CardContent>

      {showCreateRoom && (
        <CreateRoomModal
          unitId={unit.id}
          onClose={() => setShowCreateRoom(false)}
        />
      )}
    </Card>
  )
}
