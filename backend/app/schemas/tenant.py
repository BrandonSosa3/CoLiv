from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.models.tenant import TenantStatus


class TenantBase(BaseModel):
    room_id: UUID
    lease_start: date
    lease_end: date
    rent_amount: Decimal
    deposit_paid: Optional[Decimal] = None
    status: Optional[TenantStatus] = TenantStatus.PENDING
    move_in_date: Optional[date] = None


class TenantCreate(TenantBase):
    email: EmailStr  # Accept email instead of user_id
    first_name: str      # Add this field
    last_name: str       # Add this field
    password: Optional[str] = "TempPassword123!"  # Optional password


class TenantUpdate(BaseModel):
    room_id: Optional[UUID] = None
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    rent_amount: Optional[Decimal] = None
    deposit_paid: Optional[Decimal] = None
    status: Optional[TenantStatus] = None
    move_in_date: Optional[date] = None


class TenantResponse(TenantBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class TenantWithUserResponse(TenantResponse):
    """Extended response with user email"""
    email: str
    
    class Config:
        from_attributes = True
