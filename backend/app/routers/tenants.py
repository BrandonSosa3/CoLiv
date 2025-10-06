from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room, RoomStatus
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse, TenantWithUserResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """
    Create a new tenant and assign to a room
    
    This demonstrates room-level tenant assignment
    """
    
    # Verify user exists and is a tenant
    user = db.query(User).filter(User.id == tenant_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have tenant role"
        )
    
    # Check if user already has a tenant profile
    existing_tenant = db.query(Tenant).filter(Tenant.user_id == tenant_data.user_id).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a tenant profile"
        )
    
    # Verify room exists and operator has access
    room = db.query(Room).filter(Room.id == tenant_data.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check operator ownership through property
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
    
    # Check if room is available
    if room.status == RoomStatus.OCCUPIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is already occupied"
        )
    
    # Create tenant
    tenant = Tenant(**tenant_data.model_dump())
    db.add(tenant)
    
    # Update room status and link to tenant
    room.status = RoomStatus.OCCUPIED
    room.current_tenant_id = tenant.id
    
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.get("/property/{property_id}", response_model=List[TenantWithUserResponse])
def get_tenants_by_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all tenants for a specific property"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or you don't have access"
        )
    
    # Get all tenants for this property
    # Join through: tenant -> room -> unit -> property
    tenants = (
        db.query(Tenant, User.email)
        .join(Room, Tenant.room_id == Room.id)
        .join(Unit, Room.unit_id == Unit.id)
        .join(User, Tenant.user_id == User.id)
        .filter(Unit.property_id == property_id)
        .all()
    )
    
    # Format response
    result = []
    for tenant, email in tenants:
        tenant_dict = {
            "id": tenant.id,
            "user_id": tenant.user_id,
            "room_id": tenant.room_id,
            "lease_start": tenant.lease_start,
            "lease_end": tenant.lease_end,
            "rent_amount": tenant.rent_amount,
            "deposit_paid": tenant.deposit_paid,
            "status": tenant.status,
            "move_in_date": tenant.move_in_date,
            "created_at": tenant.created_at,
            "email": email
        }
        result.append(tenant_dict)
    
    return result


@router.get("/room/{room_id}", response_model=TenantWithUserResponse)
def get_tenant_by_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get the tenant assigned to a specific room"""
    
    # Verify room exists and operator has access
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
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
    
    # Get tenant for this room
    tenant = db.query(Tenant).filter(Tenant.room_id == room_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tenant assigned to this room"
        )
    
    # Get user email
    user = db.query(User).filter(User.id == tenant.user_id).first()
    
    return {
        "id": tenant.id,
        "user_id": tenant.user_id,
        "room_id": tenant.room_id,
        "lease_start": tenant.lease_start,
        "lease_end": tenant.lease_end,
        "rent_amount": tenant.rent_amount,
        "deposit_paid": tenant.deposit_paid,
        "status": tenant.status,
        "move_in_date": tenant.move_in_date,
        "created_at": tenant.created_at,
        "email": user.email
    }


@router.get("/{tenant_id}", response_model=TenantWithUserResponse)
def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific tenant"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify operator ownership through property
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    # Get user email
    user = db.query(User).filter(User.id == tenant.user_id).first()
    
    return {
        "id": tenant.id,
        "user_id": tenant.user_id,
        "room_id": tenant.room_id,
        "lease_start": tenant.lease_start,
        "lease_end": tenant.lease_end,
        "rent_amount": tenant.rent_amount,
        "deposit_paid": tenant.deposit_paid,
        "status": tenant.status,
        "move_in_date": tenant.move_in_date,
        "created_at": tenant.created_at,
        "email": user.email
    }


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a tenant (e.g., move to different room, extend lease)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify operator ownership
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    # If moving to a new room
    if tenant_data.room_id and tenant_data.room_id != tenant.room_id:
        # Verify new room exists and is available
        new_room = db.query(Room).filter(Room.id == tenant_data.room_id).first()
        if not new_room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New room not found"
            )
        
        if new_room.status == RoomStatus.OCCUPIED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New room is already occupied"
            )
        
        # Update old room
        old_room = db.query(Room).filter(Room.id == tenant.room_id).first()
        old_room.status = RoomStatus.VACANT
        old_room.current_tenant_id = None
        
        # Update new room
        new_room.status = RoomStatus.OCCUPIED
        new_room.current_tenant_id = tenant.id
    
    # Update tenant fields
    update_data = tenant_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a tenant (move-out)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify operator ownership
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    # Update room status
    room.status = RoomStatus.VACANT
    room.current_tenant_id = None
    
    # Delete tenant
    db.delete(tenant)
    db.commit()
    
    return None
