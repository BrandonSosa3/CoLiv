from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class UnitBase(BaseModel):
    unit_number: str
    floor: Optional[int] = None
    bedrooms: int
    bathrooms: int
    square_feet: Optional[int] = None
    furnished: Optional[bool] = False
    rental_type: str = "individual_rooms"


class UnitCreate(UnitBase):
    property_id: UUID


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    floor: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    square_feet: Optional[int] = None
    furnished: Optional[bool] = None
    rental_type: Optional[str] = None


class UnitResponse(UnitBase):
    id: UUID
    property_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
