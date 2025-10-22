from sqlalchemy import Column, String, ForeignKey, Text, Enum as SQLEnum, ARRAY, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class MaintenancePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class MaintenanceStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class MaintenanceRequest(BaseModel):
    __tablename__ = "maintenance_requests"
    
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"))  # Nullable for common areas
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(SQLEnum(MaintenancePriority), nullable=False, default=MaintenancePriority.MEDIUM)
    status = Column(SQLEnum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.OPEN)
    photos = Column(ARRAY(Text))  # Array of S3 URLs
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    
    # Relationships
    property = relationship("Property", back_populates="maintenance_requests")
