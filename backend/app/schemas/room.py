from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from app.models.room import RoomType, RoomStatus


class RoomBase(BaseModel):
    room_number: str
    room_type: Optional[RoomType] = RoomType.PRIVATE
    size_sqft: Optional[int] = None
    has_private_bath: Optional[bool] = False
    rent_amount: Decimal
    available_date: Optional[date] = None
    status: Optional[RoomStatus] = RoomStatus.VACANT


class RoomCreate(RoomBase):
    unit_id: UUID


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[RoomType] = None
    size_sqft: Optional[int] = None
    has_private_bath: Optional[bool] = None
    rent_amount: Optional[Decimal] = None
    available_date: Optional[date] = None
    status: Optional[RoomStatus] = None


class RoomResponse(RoomBase):
    id: UUID
    unit_id: UUID
    current_tenant_id: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
