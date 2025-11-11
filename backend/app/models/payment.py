# Update app/models/payment.py
from sqlalchemy import Column, String, ForeignKey, Date, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    FAILED = "failed"


class Payment(BaseModel):
    __tablename__ = "payments"
    
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=True)  # Made nullable
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date)
    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_method = Column(String(50))  # card, ach, manual
    stripe_payment_id = Column(String(100))
    late_fee = Column(Numeric(10, 2), default=0)
    
    # New fields for custom payment requests
    payment_type = Column(String(50), nullable=False, default='rent')  # 'rent', 'insurance', 'service_fee', 'custom'
    description = Column(String(500), nullable=True)  # Custom description for non-rent payments
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Operator who created the request
    
    # Relationships
    tenant = relationship("Tenant", back_populates="payments")
    created_by_user = relationship("User", foreign_keys=[created_by])
