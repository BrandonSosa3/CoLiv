from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room, RoomStatus
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/operator")
def get_operator_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get dashboard metrics for the operator across all properties"""
    
    operator_id = current_user.operator.id
    
    # Get all properties for this operator
    properties = db.query(Property).filter(
        Property.operator_id == operator_id
    ).all()
    
    property_ids = [p.id for p in properties]
    
    # Get all units for these properties
    units = db.query(Unit).filter(
        Unit.property_id.in_(property_ids)
    ).all() if property_ids else []
    
    unit_ids = [u.id for u in units]
    
    # Get all rooms for these units
    rooms = db.query(Room).filter(
        Room.unit_id.in_(unit_ids)
    ).all() if unit_ids else []
    
    # Calculate metrics
    total_rooms = len(rooms)
    occupied_rooms = len([r for r in rooms if r.status == RoomStatus.OCCUPIED])
    
    # Calculate total revenue from occupied rooms
    total_revenue = sum(
        float(r.rent_amount) for r in rooms if r.status == RoomStatus.OCCUPIED
    )
    
    return {
        "total_properties": len(properties),
        "total_units": len(units),
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "total_revenue": total_revenue,
    }


@router.get("/property/{property_id}")
def get_property_dashboard(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get detailed dashboard metrics for a specific property"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get units for this property
    units = db.query(Unit).filter(Unit.property_id == property_id).all()
    unit_ids = [u.id for u in units]
    
    # Get rooms for these units
    rooms = db.query(Room).filter(
        Room.unit_id.in_(unit_ids)
    ).all() if unit_ids else []
    
    # Calculate metrics
    total_rooms = len(rooms)
    occupied_rooms = len([r for r in rooms if r.status == RoomStatus.OCCUPIED])
    vacant_rooms = len([r for r in rooms if r.status == RoomStatus.VACANT])
    
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Calculate revenue
    potential_monthly = sum(float(r.rent_amount) for r in rooms)
    actual_monthly = sum(
        float(r.rent_amount) for r in rooms if r.status == RoomStatus.OCCUPIED
    )
    
    return {
        "property": {
            "id": str(property.id),
            "name": property.name,
        },
        "units": {
            "total": len(units),
        },
        "rooms": {
            "total": total_rooms,
            "occupied": occupied_rooms,
            "vacant": vacant_rooms,
            "occupancy_rate": round(occupancy_rate, 1),
        },
        "revenue": {
            "potential_monthly": potential_monthly,
            "actual_monthly": actual_monthly,
        },
    }
