from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import logging

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.room import Room, RoomStatus
from app.models.unit import Unit
from app.models.property import Property
from app.models.payment import Payment
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.utils.auth import get_current_operator, get_password_hash

router = APIRouter(prefix="/tenants", tags=["Tenants"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=TenantResponse)
def create_tenant(
    tenant: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new tenant and assign to room"""
    
    logger.info(f"Creating tenant with data: {tenant.model_dump()}")
    
    # Verify room exists and belongs to operator
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this property"
        )
    
    # Check if tenant user already exists
    existing_user = db.query(User).filter(User.email == tenant.email).first()
    
    if existing_user:
        # User exists, check if they're already a tenant
        if existing_user.role == 'tenant':
            user_id = existing_user.id
            
            # Check for existing tenant record
            existing_tenant = db.query(Tenant).filter(Tenant.user_id == user_id).first()
            
            if existing_tenant:
                if existing_tenant.status == TenantStatus.ACTIVE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This tenant is already active in another room"
                    )
                elif existing_tenant.status == TenantStatus.MOVED_OUT:
                    # Reactivate the moved out tenant
                    existing_tenant.room_id = tenant.room_id
                    existing_tenant.lease_start = tenant.lease_start
                    existing_tenant.lease_end = tenant.lease_end
                    existing_tenant.rent_amount = tenant.rent_amount
                    existing_tenant.deposit_paid = tenant.deposit_paid
                    existing_tenant.status = TenantStatus.ACTIVE
                    
                    db_tenant = existing_tenant
                else:
                    # Handle other statuses (pending, etc.)
                    existing_tenant.room_id = tenant.room_id
                    existing_tenant.lease_start = tenant.lease_start
                    existing_tenant.lease_end = tenant.lease_end
                    existing_tenant.rent_amount = tenant.rent_amount
                    existing_tenant.deposit_paid = tenant.deposit_paid
                    existing_tenant.status = TenantStatus.ACTIVE
                    
                    db_tenant = existing_tenant
            else:
                # User exists but no tenant record - create new tenant
                db_tenant = Tenant(
                    user_id=user_id,
                    room_id=tenant.room_id,
                    lease_start=tenant.lease_start,
                    lease_end=tenant.lease_end,
                    rent_amount=tenant.rent_amount,
                    deposit_paid=tenant.deposit_paid,
                    status=TenantStatus.ACTIVE
                )
                db.add(db_tenant)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered with a different role"
            )
    else:
        # Create new tenant user with a default password
        new_user = User(
            email=tenant.email,
            first_name=tenant.first_name,  # Add this
            last_name=tenant.last_name, 
            password_hash=get_password_hash(tenant.password if hasattr(tenant, 'password') else 'TempPassword123!'),
            role='tenant'
        )
        db.add(new_user)
        db.flush()
        user_id = new_user.id
        
        # Create new tenant
        db_tenant = Tenant(
            user_id=user_id,
            room_id=tenant.room_id,
            first_name=tenant.first_name,  # Add this
            last_name=tenant.last_name, 
            lease_start=tenant.lease_start,
            lease_end=tenant.lease_end,
            rent_amount=tenant.rent_amount,
            deposit_paid=tenant.deposit_paid,
            status=TenantStatus.ACTIVE
        )
        db.add(db_tenant)
    
    # Update room status to occupied
    room.status = "occupied"
    
    db.flush()
    
    # Create first month's payment
    first_payment = Payment(
        tenant_id=db_tenant.id,
        room_id=room.id,
        amount=tenant.rent_amount,
        due_date=tenant.lease_start,
        payment_method="manual",
        status="pending"
    )
    db.add(first_payment)
    
    db.commit()
    db.refresh(db_tenant)
    
    return db_tenant


@router.get("/property/{property_id}")
def get_tenants_by_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all tenants for a property with full context"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get all units for this property
    units = db.query(Unit).filter(Unit.property_id == property_id).all()
    unit_ids = [u.id for u in units]
    
    # Get all rooms for these units
    rooms = db.query(Room).filter(Room.unit_id.in_(unit_ids)).all() if unit_ids else []
    room_ids = [r.id for r in rooms]
    
    tenants = []
    
    if room_ids:
        # Get active tenants in current rooms
        active_tenants = db.query(Tenant).filter(Tenant.room_id.in_(room_ids)).all()
        
        # Get moved out tenants who were previously in rooms of this property
        # We'll track this by checking if they ever had a room in this property
        moved_out_tenants = db.query(Tenant).filter(
            Tenant.status == TenantStatus.MOVED_OUT,
            Tenant.room_id.is_(None)
        ).all()
        
        # Filter moved out tenants to only include those who belonged to this property
        # For now, we'll include all moved out tenants since we need to add property tracking
        # In a future update, we should add a property_id field to tenants table
        
        all_property_tenants = active_tenants + moved_out_tenants
        
        for tenant in all_property_tenants:
            user = db.query(User).filter(User.id == tenant.user_id).first()
            
            if tenant.room_id:
                # Active tenant with room
                room = db.query(Room).filter(Room.id == tenant.room_id).first()
                unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
                
                tenants.append({
                    "id": str(tenant.id),
                    "user_id": str(tenant.user_id),
                    "room_id": str(tenant.room_id),
                    "lease_start": tenant.lease_start.isoformat(),
                    "lease_end": tenant.lease_end.isoformat(),
                    "rent_amount": str(tenant.rent_amount),
                    "deposit_paid": str(tenant.deposit_paid) if tenant.deposit_paid else None,
                    "status": tenant.status,
                    "move_in_date": tenant.move_in_date.isoformat() if tenant.move_in_date else None,
                    "created_at": tenant.created_at.isoformat(),
                    "email": user.email,
                    "first_name": user.first_name,  # ADD THIS LINE
                    "last_name": user.last_name,    # ADD THIS LINE
                    "room_number": room.room_number,
                    "unit_number": unit.unit_number,
                    "property_name": property.name,
                })
            else:
                # Moved out tenant (no current room)
                tenants.append({
                    "id": str(tenant.id),
                    "user_id": str(tenant.user_id),
                    "room_id": None,
                    "lease_start": tenant.lease_start.isoformat(),
                    "lease_end": tenant.lease_end.isoformat(),
                    "rent_amount": str(tenant.rent_amount),
                    "deposit_paid": str(tenant.deposit_paid) if tenant.deposit_paid else None,
                    "status": tenant.status,
                    "move_in_date": tenant.move_in_date.isoformat() if tenant.move_in_date else None,
                    "created_at": tenant.created_at.isoformat(),
                    "email": user.email,
                    "first_name": user.first_name,  # ADD THIS LINE
                    "last_name": user.last_name,    # ADD THIS LINE
                    "room_number": "N/A",
                    "unit_number": "N/A", 
                    "property_name": property.name,
                })
    
    return tenants


@router.get("/room/{room_id}")
def get_tenants_by_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get tenants for a specific room with full context"""
    
    # Get room and verify ownership
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Get tenants for this room
    tenant_records = db.query(Tenant).filter(Tenant.room_id == room_id).all()
    
    tenants = []
    for tenant in tenant_records:
        user = db.query(User).filter(User.id == tenant.user_id).first()
        
        tenants.append({
            "id": str(tenant.id),
            "user_id": str(tenant.user_id),
            "room_id": str(tenant.room_id),
            "lease_start": tenant.lease_start.isoformat(),
            "lease_end": tenant.lease_end.isoformat(),
            "rent_amount": str(tenant.rent_amount),
            "deposit_paid": str(tenant.deposit_paid) if tenant.deposit_paid else None,
            "status": tenant.status,
            "move_in_date": tenant.move_in_date.isoformat() if tenant.move_in_date else None,
            "created_at": tenant.created_at.isoformat(),
            "email": user.email,
            "first_name": user.first_name,  # ADD THIS LINE
            "last_name": user.last_name,    # ADD THIS LINE
            "room_number": room.room_number,
            "unit_number": unit.unit_number,
            "property_name": property.name,
        })
    
    return tenants


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: str,
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
    
    # Verify ownership through room -> unit -> property
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify ownership
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update fields
    for key, value in tenant_update.model_dump(exclude_unset=True).items():
        setattr(tenant, key, value)
    
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.delete("/{tenant_id}")

@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Mark tenant as moved out (preserves all historical data)"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify ownership
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Mark room as available
    room.status = RoomStatus.VACANT
    
    # Mark tenant as moved out (DON'T DELETE - preserve history!)
    tenant.status = TenantStatus.MOVED_OUT
    
    # Keep all payment records intact for accounting/legal purposes
    
    db.commit()
    
    return {"message": "Tenant marked as moved out successfully"}
    return {"message": "Tenant removed successfully"}
