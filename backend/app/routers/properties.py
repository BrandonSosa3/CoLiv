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
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    property: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new property"""
    db_property = Property(**property.model_dump(), operator_id=current_user.operator.id)
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


@router.get("/", response_model=List[PropertyResponse])
def get_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all properties for the current operator"""
    properties = db.query(Property).filter(
        Property.operator_id == current_user.operator.id
    ).all()
    return properties


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return property


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: UUID,
    property_update: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    for key, value in property_update.model_dump(exclude_unset=True).items():
        setattr(property, key, value)
    
    db.commit()
    db.refresh(property)
    
    return property


@router.delete("/{property_id}")
def delete_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a property with proper validation"""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get all units and rooms for this property
    units = db.query(Unit).filter(Unit.property_id == property_id).all()
    unit_ids = [unit.id for unit in units]
    
    rooms = []
    room_ids = []
    if unit_ids:
        rooms = db.query(Room).filter(Room.unit_id.in_(unit_ids)).all()
        room_ids = [room.id for room in rooms]
    
    # Check for active tenants in any room
    if room_ids:
        active_tenants = db.query(Tenant).filter(
            Tenant.room_id.in_(room_ids),
            Tenant.status.in_([TenantStatus.ACTIVE, TenantStatus.PENDING])
        ).all()
        
        if active_tenants:
            tenant_names = []
            for tenant in active_tenants:
                user = db.query(User).filter(User.id == tenant.user_id).first()
                tenant_names.append(f"{user.first_name} {user.last_name}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete property. Active tenant(s) {', '.join(tenant_names)} still assigned. Please move out all tenants first."
            )
        
        # Check for unpaid payments across all rooms
        unpaid_payments = db.query(Payment).filter(
            Payment.room_id.in_(room_ids),
            Payment.status != 'PAID'
        ).count()
        
        if unpaid_payments > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete property. There are {unpaid_payments} unpaid payment(s) across all units. Please resolve all outstanding balances first."
            )
    
    # Safe to delete - update payments to preserve data but remove room references
    if room_ids:
        db.query(Tenant).filter(
            Tenant.room_id.in_(room_ids),
            Tenant.status == TenantStatus.MOVED_OUT
        ).update({"room_id": None})
    
    # Delete the property (units and rooms will cascade delete due to FK constraints)
    db.delete(property)
    db.commit()
    
    return {"message": "Property deleted successfully"}
