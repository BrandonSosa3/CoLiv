from sqlalchemy import Column, String, ForeignKey, Date, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class TenantStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    MOVED_OUT = "moved_out"


class Tenant(BaseModel):
    __tablename__ = "tenants"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    lease_start = Column(Date, nullable=False)
    lease_end = Column(Date, nullable=False)
    rent_amount = Column(Numeric(10, 2), nullable=False)
    deposit_paid = Column(Numeric(10, 2))
    status = Column(SQLEnum(TenantStatus), nullable=False, default=TenantStatus.PENDING)
    move_in_date = Column(Date)
    
    # Relationships
    user = relationship("User", back_populates="tenant")
    room = relationship("Room", foreign_keys=[room_id])
    payments = relationship("Payment", back_populates="tenant", cascade="all, delete-orphan")
