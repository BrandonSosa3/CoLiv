from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from app.models.maintenance import MaintenancePriority, MaintenanceStatus


class MaintenanceRequestBase(BaseModel):
    property_id: UUID
    unit_id: UUID
    room_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    priority: Optional[MaintenancePriority] = MaintenancePriority.medium


class MaintenanceRequestCreate(MaintenanceRequestBase):
    tenant_id: Optional[UUID] = None


class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[MaintenancePriority] = None
    status: Optional[MaintenanceStatus] = None
    assigned_to: Optional[UUID] = None


class MaintenanceRequestResponse(MaintenanceRequestBase):
    id: UUID
    tenant_id: Optional[UUID] = None
    status: MaintenanceStatus
    photos: Optional[List[str]] = None
    assigned_to: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MaintenanceRequestWithDetailsResponse(MaintenanceRequestResponse):
    """Extended response with location details"""
    unit_number: str
    room_number: Optional[str] = None
    tenant_email: Optional[str] = None
    
    class Config:
        from_attributes = True
