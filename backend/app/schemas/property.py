from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip: str
    total_units: Optional[int] = 0
    amenities: Optional[dict] = None
    house_rules: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    total_units: Optional[int] = None
    amenities: Optional[dict] = None
    house_rules: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: UUID
    operator_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
