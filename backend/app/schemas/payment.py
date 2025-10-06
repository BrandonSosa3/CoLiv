from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    tenant_id: UUID
    room_id: UUID
    amount: Decimal
    due_date: date
    status: Optional[PaymentStatus] = PaymentStatus.PENDING
    payment_method: Optional[str] = None
    late_fee: Optional[Decimal] = 0


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    paid_date: Optional[date] = None
    status: Optional[PaymentStatus] = None
    payment_method: Optional[str] = None
    late_fee: Optional[Decimal] = None


class PaymentResponse(PaymentBase):
    id: UUID
    paid_date: Optional[date] = None
    stripe_payment_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentWithDetailsResponse(PaymentResponse):
    """Extended response with tenant and room info"""
    tenant_email: str
    room_number: str
    unit_number: str
    
    class Config:
        from_attributes = True
