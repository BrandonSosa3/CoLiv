from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class TenantPreference(Base):
    __tablename__ = "tenant_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Lifestyle Preferences (1-5 scale)
    cleanliness_importance = Column(Integer, default=3)  # 1=messy, 5=very clean
    noise_tolerance = Column(Integer, default=3)  # 1=quiet, 5=loud okay
    guest_frequency = Column(Integer, default=3)  # 1=never, 5=often
    
    # Schedule
    sleep_schedule = Column(String(50))  # early_bird, night_owl, flexible
    work_schedule = Column(String(50))  # remote, office, hybrid, student
    
    # Personality
    social_preference = Column(Integer, default=3)  # 1=introvert, 5=extrovert
    
    # Dealbreakers (boolean)
    smoking = Column(Boolean, default=False)
    pets = Column(Boolean, default=False)
    overnight_guests = Column(Boolean, default=True)
    
    # Interests (comma-separated tags)
    interests = Column(Text)  # e.g., "fitness,cooking,gaming,music"
    
    # Additional notes
    notes = Column(Text)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="preference")
