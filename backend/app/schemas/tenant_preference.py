from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict


class TenantPreferenceBase(BaseModel):
    cleanliness_importance: int = 3
    noise_tolerance: int = 3
    guest_frequency: int = 3
    sleep_schedule: str = "flexible"
    work_schedule: str = "remote"
    social_preference: int = 3
    smoking: bool = False
    pets: bool = False
    overnight_guests: bool = True
    interests: Optional[str] = None
    notes: Optional[str] = None


class TenantPreferenceCreate(TenantPreferenceBase):
    tenant_id: UUID


class TenantPreferenceUpdate(BaseModel):
    cleanliness_importance: Optional[int] = None
    noise_tolerance: Optional[int] = None
    guest_frequency: Optional[int] = None
    sleep_schedule: Optional[str] = None
    work_schedule: Optional[str] = None
    social_preference: Optional[int] = None
    smoking: Optional[bool] = None
    pets: Optional[bool] = None
    overnight_guests: Optional[bool] = None
    interests: Optional[str] = None
    notes: Optional[str] = None


class TenantPreferenceResponse(TenantPreferenceBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RoommateMatch(BaseModel):
    tenant_id: str
    email: str
    current_room_id: str
    compatibility_score: float
    breakdown: Dict[str, float]
    common_interests: List[str]
