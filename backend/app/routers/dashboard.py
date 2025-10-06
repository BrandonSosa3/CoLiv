from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room, RoomStatus
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/property/{property_id}")
def get_property_dashboard(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get dashboard metrics for a property"""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    total_units = db.query(Unit).filter(Unit.property_id == property_id).count()
    total_rooms = db.query(Room).join(Unit).filter(Unit.property_id == property_id).count()
    occupied_rooms = db.query(Room).join(Unit).filter(
        Unit.property_id == property_id,
        Room.status == RoomStatus.OCCUPIED
    ).count()
    
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    revenue_potential = db.query(func.sum(Room.rent_amount)).join(Unit).filter(
        Unit.property_id == property_id
    ).scalar() or Decimal(0)
    
    actual_revenue = db.query(func.sum(Room.rent_amount)).join(Unit).filter(
        Unit.property_id == property_id,
        Room.status == RoomStatus.OCCUPIED
    ).scalar() or Decimal(0)
    
    return {
        "property": {"id": property.id, "name": property.name},
        "units": {"total": total_units},
        "rooms": {
            "total": total_rooms,
            "occupied": occupied_rooms,
            "vacant": total_rooms - occupied_rooms,
            "occupancy_rate": round(occupancy_rate, 2)
        },
        "revenue": {
            "potential_monthly": float(revenue_potential),
            "actual_monthly": float(actual_revenue)
        }
    }
