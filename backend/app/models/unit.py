from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Unit(BaseModel):
    __tablename__ = "units"
    
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(String(20), nullable=False)
    floor = Column(Integer)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    square_feet = Column(Integer)
    furnished = Column(Boolean, default=False)
    rental_type = Column(String(20), nullable=False, default="individual_rooms")  # Add this line
    
    # Relationships
    property = relationship("Property", back_populates="units")
    rooms = relationship("Room", back_populates="unit", cascade="all, delete-orphan")
