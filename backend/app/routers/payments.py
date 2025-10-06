from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse, PaymentWithDetailsResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new payment record"""
    
    tenant = db.query(Tenant).filter(Tenant.id == payment_data.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    
    room = db.query(Room).filter(Room.id == payment_data.room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(
        Property.id == unit.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    payment = Payment(**payment_data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/property/{property_id}", response_model=List[PaymentWithDetailsResponse])
def get_payments_by_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all payments for a property"""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    payments = (
        db.query(Payment, User.email, Room.room_number, Unit.unit_number)
        .join(Tenant, Payment.tenant_id == Tenant.id)
        .join(User, Tenant.user_id == User.id)
        .join(Room, Payment.room_id == Room.id)
        .join(Unit, Room.unit_id == Unit.id)
        .filter(Unit.property_id == property_id)
        .order_by(Payment.due_date.desc())
        .all()
    )
    
    result = []
    for payment, email, room_number, unit_number in payments:
        result.append({
            "id": payment.id,
            "tenant_id": payment.tenant_id,
            "room_id": payment.room_id,
            "amount": payment.amount,
            "due_date": payment.due_date,
            "paid_date": payment.paid_date,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "stripe_payment_id": payment.stripe_payment_id,
            "late_fee": payment.late_fee,
            "created_at": payment.created_at,
            "tenant_email": email,
            "room_number": room_number,
            "unit_number": unit_number
        })
    
    return result


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a payment"""
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    
    update_data = payment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    
    db.commit()
    db.refresh(payment)
    return payment
