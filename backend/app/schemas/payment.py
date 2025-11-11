# Update app/schemas/payment.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    tenant_id: UUID
    room_id: Optional[UUID] = None  # Made optional for custom payments
    amount: Decimal
    due_date: date
    status: Optional[PaymentStatus] = PaymentStatus.PENDING
    payment_method: Optional[str] = None
    late_fee: Optional[Decimal] = 0
    payment_type: str = 'rent'  # Add this
    description: Optional[str] = None  # Add this


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
    created_by: Optional[UUID] = None  # Add this
    
    class Config:
        from_attributes = True


class PaymentWithDetailsResponse(PaymentResponse):
    """Extended response with tenant and room info"""
    tenant_email: str
    room_number: Optional[str] = None  # Made optional for custom payments
    unit_number: Optional[str] = None  # Made optional for custom payments
    created_by_name: Optional[str] = None  # Add this
    
    class Config:
        from_attributes = True


# New schema for creating custom payment requests
class CustomPaymentRequest(BaseModel):
    tenant_id: UUID
    amount: Decimal
    due_date: date
    payment_type: str  # 'insurance', 'service_fee', 'custom', etc.
    description: str  # Required for custom payments
    payment_method: Optional[str] = 'manual'
