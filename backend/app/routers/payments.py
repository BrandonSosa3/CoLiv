from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta

from app.database import get_db
from app.models.user import User
from app.models.payment import Payment
from app.models.tenant import Tenant, TenantStatus
from app.models.room import Room
from app.models.unit import Unit
from app.models.property import Property
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new payment record"""
    
    # Verify tenant exists and belongs to operator
    tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
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
    
    # Create payment
    db_payment = Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    return db_payment


@router.get("/property/{property_id}")
def get_payments_by_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all payments for a property with tenant details"""
    
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
    
    # Get all tenants for these rooms
    tenants = db.query(Tenant).filter(Tenant.room_id.in_(room_ids)).all() if room_ids else []
    tenant_ids = [t.id for t in tenants]
    
    # Get all payments for these tenants with details
    payments = []
    if tenant_ids:
        payment_records = db.query(Payment).filter(Payment.tenant_id.in_(tenant_ids)).all()
        
        for payment in payment_records:
            tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
            user = db.query(User).filter(User.id == tenant.user_id).first()
            room = db.query(Room).filter(Room.id == tenant.room_id).first()
            unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
            
            payments.append({
                "id": str(payment.id),
                "tenant_id": str(payment.tenant_id),
                "amount": str(payment.amount),
                "payment_date": payment.paid_date.isoformat() if payment.paid_date else None,
                "payment_method": payment.payment_method,
                "status": payment.status,
                "due_date": payment.due_date.isoformat(),
                "created_at": payment.created_at.isoformat(),
                "payment_type": payment.payment_type if payment.payment_type else "rent",
                "description": payment.description,
                "tenant_email": user.email,
                "tenant_first_name": user.first_name,
                "tenant_last_name": user.last_name,
                "room_number": room.room_number,
                "unit_number": unit.unit_number,
                "property_name": property.name,
            })
    
    return payments


@router.post("/custom-request", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_custom_payment_request(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """
    Create a custom payment request (insurance, service fee, utilities, etc.)
    This allows operators to create ad-hoc payments for tenants.
    """
    
    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Verify operator has access to this tenant through property ownership
    if tenant.room_id:
        room = db.query(Room).filter(Room.id == tenant.room_id).first()
        unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
        property = db.query(Property).filter(Property.id == unit.property_id).first()
        
        if property.operator_id != current_user.operator.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create payment for this tenant"
            )
    
    # Validate this is a custom payment (not regular rent)
    if not payment.payment_type or payment.payment_type == 'rent':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="payment_type is required and cannot be 'rent' for custom requests"
        )
    
    # Validate description is provided for custom payments
    if not payment.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="description is required for custom payment requests"
        )
    
    # Create the custom payment request
    db_payment = Payment(
        tenant_id=payment.tenant_id,
        room_id=payment.room_id,  # Can be None for property-wide payments
        amount=payment.amount,
        due_date=payment.due_date,
        payment_type=payment.payment_type,
        description=payment.description,
        payment_method=payment.payment_method if payment.payment_method else 'manual',
        late_fee=payment.late_fee if payment.late_fee else 0,
        status='pending',
        created_by=current_user.id  # Track who created it
    )
    
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    return db_payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: str,
    payment_update: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a payment record"""
    
    # Get the payment
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Verify ownership through tenant -> room -> unit -> property
    tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
    if tenant.room_id:
        room = db.query(Room).filter(Room.id == tenant.room_id).first()
        unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
        property = db.query(Property).filter(Property.id == unit.property_id).first()
        
        if property.operator_id != current_user.operator.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this payment"
            )
    
    # Update payment fields
    update_data = payment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.commit()
    db.refresh(payment)
    
    return payment
