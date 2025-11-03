from sqlalchemy import Column, String, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    OPERATOR = "operator"
    TENANT = "tenant"
    ADMIN = "admin"



class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Now nullable
    role = Column(SQLEnum(UserRole), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_activated = Column(Boolean, default=True, nullable=False)  # New field
    
    # Relationships
    operator = relationship("Operator", back_populates="user", uselist=False)
    tenant = relationship("Tenant", back_populates="user", uselist=False)
