from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Operator(BaseModel):
    __tablename__ = "operators"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(255))
    phone = Column(String(20))
    subscription_status = Column(String(50), default="trial")  # trial, active, canceled
    stripe_customer_id = Column(String(100))
    
    # Relationships
    user = relationship("User", back_populates="operator")
    properties = relationship("Property", back_populates="operator", cascade="all, delete-orphan")
