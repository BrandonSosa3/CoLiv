from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room
from app.models.tenant import Tenant, TenantStatus
from app.models.payment import Payment
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/units", tags=["Units"])


@router.post("/", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_data: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new unit"""
    
    # Verify property belongs to operator
    property = db.query(Property).filter(
        Property.id == unit_data.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or you don't have access"
        )
    
    # Create unit
    unit = Unit(**unit_data.model_dump())
    db.add(unit)
    db.flush()  # Get the unit ID without committing
    
    # If this is a whole unit rental, create a virtual room
    if unit_data.rental_type == "whole_unit":
        from app.models.room import Room  # Import Room model
        
        virtual_room = Room(
            unit_id=unit.id,
            room_number="Whole Unit",
            room_type="private",
            rent_amount=0,  # Will be set during tenant assignment
            size_sqft=unit_data.square_feet,  # Inherit from unit
            has_private_bath=True,  # Whole unit has all amenities
            status="vacant"
        )
        db.add(virtual_room)
    
    db.commit()
    db.refresh(unit)
    
    return unit


@router.get("/property/{property_id}", response_model=List[UnitResponse])
def get_units_by_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all units for a specific property"""
    
    # Verify property belongs to operator
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or you don't have access"
        )
    
    units = db.query(Unit).filter(Unit.property_id == property_id).all()
    return units


@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(
    unit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific unit"""
    
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
    
    return unit


@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(
    unit_id: UUID,
    unit_data: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a unit"""
    
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
    
    # Update fields
    update_data = unit_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)
    
    db.commit()
    db.refresh(unit)
    
    return unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a unit with proper validation"""
    
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
    
    # Get all rooms in this unit
    rooms = db.query(Room).filter(Room.unit_id == unit_id).all()
    room_ids = [str(room.id) for room in rooms]
    
    # Check for active tenants in any room
    active_tenants = db.query(Tenant).filter(
        Tenant.room_id.in_(room_ids),
        Tenant.status == TenantStatus.ACTIVE
    ).all()
    
    if active_tenants:
        tenant_names = []
        for tenant in active_tenants:
            user = db.query(User).filter(User.id == tenant.user_id).first()
            tenant_names.append(f"{user.first_name} {user.last_name}")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete unit. Active tenant(s) {', '.join(tenant_names)} still assigned. Please move out all tenants first."
        )
    
    # Check for unpaid payments in any room
    unpaid_payments = db.query(Payment).filter(
        Payment.room_id.in_(room_ids),
        Payment.status != 'PAID'
    ).count()
    
    if unpaid_payments > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete unit. There are {unpaid_payments} unpaid payment(s) across all rooms. Please resolve all outstanding balances first."
        )
    
    # Safe to delete - update payments to preserve data but remove room references
    db.query(Tenant).filter(
    Tenant.room_id.in_(room_ids),
    Tenant.status == TenantStatus.MOVED_OUT
    ).update({"room_id": None})
    
    # Delete the unit (rooms will cascade delete due to FK constraint)
    db.delete(unit)
    db.commit()
    
    return None
