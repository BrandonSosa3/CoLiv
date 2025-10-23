from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.models.tenant import Tenant, TenantStatus
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """
    Create a new room
    
    KEY DIFFERENTIATOR: This enables room-level tracking within units
    """
    
    # Get unit and verify access
    unit = db.query(Unit).filter(Unit.id == room_data.unit_id).first()
    
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    
    # Verify operator owns the property
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this unit"
        )
    
    # Create room
    room = Room(**room_data.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    
    return room


@router.get("/unit/{unit_id}")
def get_rooms_by_unit(
    unit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all rooms for a specific unit with tenant information"""
    
    # Get unit and verify access
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    
    # Verify operator owns the property
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this unit"
        )
    
    rooms = db.query(Room).filter(Room.unit_id == unit_id).all()
    
    # Add tenant information to each room
    rooms_with_tenants = []
    for room in rooms:
        # Get tenant in this room (if any)
        tenant = db.query(Tenant).filter(
            Tenant.room_id == room.id,
            Tenant.status == TenantStatus.ACTIVE
        ).first()
        
        room_data = {
            "id": str(room.id),
            "room_number": room.room_number,
            "room_type": room.room_type,
            "rent_amount": room.rent_amount,
            "size_sqft": room.size_sqft,
            "has_private_bath": room.has_private_bath,
            "status": room.status,
            "unit_id": str(room.unit_id),
            "created_at": room.created_at,
            "updated_at": room.updated_at,
            "tenant": None
        }
        
        if tenant:
            user = db.query(User).filter(User.id == tenant.user_id).first()
            room_data["tenant"] = {
                "id": str(tenant.id),
                "first_name": getattr(user, 'first_name', None) or "Unknown",
                "last_name": getattr(user, 'last_name', None) or "User", 
                "email": user.email,
                "lease_start": tenant.lease_start,
                "lease_end": tenant.lease_end,
                "status": tenant.status
            }
        
        rooms_with_tenants.append(room_data)
    
    return rooms_with_tenants


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific room"""
    
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Verify operator owns the property
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this room"
        )
    
    return room


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: UUID,
    room_data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a room"""
    
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Verify operator owns the property
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this room"
        )
    
    # Update fields
    update_data = room_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)
    
    db.commit()
    db.refresh(room)
    
    return room


@router.delete("/{room_id}")
def delete_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a room and mark any tenants as moved out"""
    
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Verify operator owns the property
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this room"
        )
    
    # Mark any tenants in this room as moved out (don't delete them)
    tenants_in_room = db.query(Tenant).filter(Tenant.room_id == room_id).all()
    for tenant in tenants_in_room:
        tenant.status = TenantStatus.MOVED_OUT
        tenant.room_id = None
    
    # Now safe to delete the room
    db.delete(room)
    db.commit()
    
    return None
