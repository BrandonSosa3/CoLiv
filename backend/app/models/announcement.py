from sqlalchemy import Column, String, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class AnnouncementPriority(str, enum.Enum):
    NORMAL = "normal"
    IMPORTANT = "important"
    URGENT = "urgent"


class Announcement(BaseModel):
    __tablename__ = "announcements"
    
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
    message = Column(Text, nullable=False)
    priority = Column(SQLEnum(AnnouncementPriority), default=AnnouncementPriority.NORMAL)
    
    # Relationships
    property = relationship("Property", back_populates="announcements")
