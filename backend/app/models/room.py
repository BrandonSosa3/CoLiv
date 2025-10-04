from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Numeric, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class RoomType(str, enum.Enum):
    PRIVATE = "private"
    SHARED = "shared"


class RoomStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Room(BaseModel):
    """
    KEY DIFFERENTIATOR: Room-level tracking
    This is what makes CoLiv OS different from traditional property management
    """
    __tablename__ = "rooms"
    
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(10), nullable=False)  # "A", "B", "C", "Master"
    room_type = Column(SQLEnum(RoomType), default=RoomType.PRIVATE)
    size_sqft = Column(Integer)
    has_private_bath = Column(Boolean, default=False)
    rent_amount = Column(Numeric(10, 2), nullable=False)  # Each room has individual rent
    available_date = Column(Date)
    status = Column(SQLEnum(RoomStatus), nullable=False, default=RoomStatus.VACANT)
    current_tenant_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    unit = relationship("Unit", back_populates="rooms")
