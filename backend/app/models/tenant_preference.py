from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base
from app.utils.timestamps import TimestampMixin


class TenantPreference(Base, TimestampMixin):
    __tablename__ = "tenant_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Lifestyle Preferences (1-5 scale)
    cleanliness_importance = Column(Integer, default=3)
    noise_tolerance = Column(Integer, default=3)
    guest_frequency = Column(Integer, default=3)
    
    # Schedule
    sleep_schedule = Column(String(50), default='flexible')
    work_schedule = Column(String(50), default='remote')
    
    # Personality
    social_preference = Column(Integer, default=3)
    
    # Dealbreakers (boolean)
    smoking = Column(Boolean, default=False)
    pets = Column(Boolean, default=False)
    overnight_guests = Column(Boolean, default=True)
    
    # Interests (comma-separated tags)
    interests = Column(Text)
    
    # Additional notes
    notes = Column(Text)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="preference")
