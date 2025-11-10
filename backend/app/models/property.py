from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Property(BaseModel):
    __tablename__ = "properties"
    
    operator_id = Column(UUID(as_uuid=True), ForeignKey("operators.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip = Column(String(20), nullable=False)
    total_units = Column(Integer, default=0)
    amenities = Column(JSONB)  # {"gym": true, "rooftop": true, etc}
    house_rules = Column(Text)
    
    # Relationships
    operator = relationship("Operator", back_populates="properties")
    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="property", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="property", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="property")
