from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.models.announcement import AnnouncementPriority


class AnnouncementBase(BaseModel):
    property_id: UUID
    title: Optional[str] = None
    message: str
    priority: Optional[AnnouncementPriority] = AnnouncementPriority.NORMAL


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    priority: Optional[AnnouncementPriority] = None


class AnnouncementResponse(AnnouncementBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnnouncementWithCreatorResponse(AnnouncementResponse):
    """Extended response with creator email"""
    creator_email: str
    
    class Config:
        from_attributes = True
